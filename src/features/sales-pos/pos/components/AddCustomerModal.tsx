import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Phone, Mail, MapPin, X } from 'lucide-react-native';
import { API_BASE_URL, authorizedFetch, getUserData } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { KeyboardAware } from '@/components/ui/keyboard-aware';
import { POSCustomer } from '@/features/sales-pos/pos/types/pos.types';
import { colors, radius, spacing } from '@/theme/tokens';

interface AddCustomerModalProps {
  visible: boolean;
  branchId: string | null;
  initialPhone?: string;
  onClose: () => void;
  onSuccess: (customer: POSCustomer) => void;
}

export function AddCustomerModal({
  visible,
  branchId,
  initialPhone = '',
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setPhone(initialPhone);
  }, [visible, initialPhone]);

  const handleSubmit = async () => {
    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedPhone) {
      Alert.alert('Required', 'Name and phone are required');
      return;
    }
    if (!/^\d{11}$/.test(trimmedPhone) || !trimmedPhone.startsWith('01')) {
      Alert.alert('Invalid phone', 'Enter a valid 11-digit BD number (01XXXXXXXXX)');
      return;
    }
    if (!branchId) {
      Alert.alert('Branch required', 'Please select a branch first');
      return;
    }

    setLoading(true);
    try {
      const user = getUserData<{ role?: string; id?: string }>();
      const isEmployee = (user?.role ?? '').toLowerCase() === 'employee';

      const res = await authorizedFetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        body: JSON.stringify({
          phone: trimmedPhone,
          name: trimmedName,
          address: address.trim() || undefined,
          email: email.trim() || undefined,
          branchId,
          assignedEmployeeId: isEmployee && user?.id ? user.id : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create customer');
      }

      const result = await res.json();
      const data = result.data ?? result;
      onSuccess({
        id: data.id,
        name: trimmedName,
        phone: trimmedPhone,
        email: email.trim() || undefined,
        address: address.trim() || data.address,
        image: data.image,
        totalOrders: 0,
        totalSpent: 0,
      });
      setPhone('');
      setName('');
      setAddress('');
      setEmail('');
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAware style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
          <Text style={styles.headerTitle}>Add Customer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#fff" size={20} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Field icon={Phone} label="Phone *">
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 11))}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={11}
            />
          </Field>
          <Field icon={User} label="Name *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Customer name"
            />
          </Field>
          <Field icon={MapPin} label="Address">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              multiline
            />
          </Field>
          <Field icon={Mail} label="Email">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <View style={{ flex: 1 }}>
            <Button title="Create" loading={loading} onPress={() => void handleSubmit()} />
          </View>
        </View>
      </KeyboardAware>
    </Modal>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ color?: string; size?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Icon color={colors.accentPrimary} size={14} />
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { padding: spacing.md, gap: 14 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
  },
});
