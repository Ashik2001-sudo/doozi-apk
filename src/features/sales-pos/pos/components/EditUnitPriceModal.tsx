import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pencil } from 'lucide-react-native';
import { KeyboardAware } from '@/components/ui/keyboard-aware';
import { CartItem } from '@/features/sales-pos/pos/types/pos.types';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

type EditUnitPriceModalProps = {
  item: CartItem | null;
  priceInput: string;
  onPriceInputChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function EditUnitPriceModal({
  item,
  priceInput,
  onPriceInputChange,
  onClose,
  onSave,
}: EditUnitPriceModalProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      const len = priceInput.length;
      // Keep caret at end — do not select the whole price.
      inputRef.current?.setNativeProps({ selection: { start: len, end: len } });
    }, 50);
    return () => clearTimeout(t);
    // Only when modal opens for an item
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) return null;

  const parsed = parseFloat(priceInput.replace(/,/g, ''));
  const valid = !Number.isNaN(parsed) && parsed >= 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAware style={styles.overlay}>
        <View style={[styles.card, shadows.soft]}>
          <View style={styles.iconWrap}>
            <Pencil color={colors.accentPrimary} size={24} />
          </View>
          <Text style={styles.title}>Edit Unit Price</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>
          {item.variantName ? (
            <Text style={styles.variantName} numberOfLines={1}>
              {item.variantName}
            </Text>
          ) : null}

          <Text style={styles.label}>Unit price</Text>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={priceInput}
              onChangeText={(value) => onPriceInputChange(value.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus={false}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}
              onPress={onSave}
              disabled={!valid}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveInner}>
                <Text style={styles.saveText}>Save Price</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAware>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    marginBottom: 14,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  productName: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  variantName: { marginTop: 4, color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  label: {
    alignSelf: 'stretch',
    marginTop: 20,
    marginBottom: 8,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputWrap: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
  },
  input: {
    color: colors.accentPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 14,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cancelText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 13, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.45 },
  saveInner: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
