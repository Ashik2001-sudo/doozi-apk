import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, X } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { formatMoney } from '../utils';
import type { usePayDue } from '../hooks/usePayDue';

type PayDue = ReturnType<typeof usePayDue>;

type Props = {
  pay: PayDue;
  dueAmount: number;
};

export function PayDueSheet({ pay, dueAmount }: Props) {
  const insets = useSafeAreaInsets();
  const [localPicker, setLocalPicker] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!pay.selectedAccount) return 'Select account';
    return pay.selectedAccount.accountName;
  }, [pay.selectedAccount]);

  return (
    <>
      <Modal visible={pay.open} transparent animationType="slide" onRequestClose={pay.closePay}>
        <Pressable style={styles.sheetOverlay} onPress={pay.closePay}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Pay due</Text>
                <Text style={styles.sheetSub}>Due balance {formatMoney(dueAmount)}</Text>
              </View>
              <TouchableOpacity onPress={pay.closePay} hitSlop={10}>
                <X color={colors.textMuted} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={pay.amount}
              onChangeText={(v) => pay.setAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Account</Text>
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => setLocalPicker(true)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.accountName}>{selectedLabel}</Text>
                {pay.selectedAccount ? (
                  <Text style={styles.accountHint}>{pay.selectedAccount.accountType}</Text>
                ) : (
                  <Text style={styles.accountHint}>Required for payment</Text>
                )}
              </View>
              <ChevronDown color={colors.textMuted} size={18} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
              value={pay.note}
              onChangeText={pay.setNote}
              placeholder="Payment note…"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="secondary" onPress={pay.closePay} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Confirm pay" loading={pay.loading} onPress={() => void pay.submit()} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={localPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setLocalPicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setLocalPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select account</Text>
            <FlatList
              data={pay.accounts}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyPayments}>No accounts available</Text>
              }
              renderItem={({ item }) => {
                const on = item.id === pay.accountId;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, on && styles.pickerItemOn]}
                    onPress={() => {
                      pay.setAccountId(item.id);
                      setLocalPicker(false);
                    }}
                  >
                    <Text style={styles.accountName}>{item.accountName}</Text>
                    <Text style={styles.accountHint}>{item.accountType}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
