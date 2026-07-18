import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, User, Phone, Plus, X } from 'lucide-react-native';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { POSCustomer } from '@/features/sales-pos/pos/types/pos.types';
import { resolveCustomerOnPhoneEnter } from '@/features/sales-pos/pos/utils/customerPhoneEnter';
import { colors, radius, spacing } from '@/theme/tokens';

interface CustomerSelectModalProps {
  visible: boolean;
  branchId: string | null;
  selectedCustomer: POSCustomer | null;
  onClose: () => void;
  onSelect: (customer: POSCustomer) => void;
  onWalkIn: () => void;
  onAddNew: (phone?: string) => void;
}

export function CustomerSelectModal({
  visible,
  branchId,
  selectedCustomer,
  onClose,
  onSelect,
  onWalkIn,
  onAddNew,
}: CustomerSelectModalProps) {
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [enterBusy, setEnterBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchTerm('');
      setCustomers([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (searchTerm.trim()) params.append('search', searchTerm.trim());
          const res = await authorizedFetch(`${API_BASE_URL}/customers?${params}`);
          if (res.ok) {
            const json = await res.json();
            const raw = json.data ?? json;
            setCustomers(Array.isArray(raw) ? raw : []);
          } else {
            setCustomers([]);
          }
        } catch {
          setCustomers([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(timer);
  }, [visible, searchTerm]);

  const handlePhoneEnter = async () => {
    if (!searchTerm.trim() || enterBusy) return;
    setEnterBusy(true);
    try {
      const result = await resolveCustomerOnPhoneEnter(searchTerm, customers);
      if (!result) return;
      if ('customer' in result) {
        onSelect(result.customer);
        onClose();
        return;
      }
      onAddNew(result.phone);
      onClose();
    } finally {
      setEnterBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
          <Text style={styles.headerTitle}>Select Customer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#fff" size={20} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.searchRow}>
          <Search color={colors.accentPrimary} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search or enter phone…"
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            keyboardType="phone-pad"
            returnKeyType="search"
            blurOnSubmit={false}
            editable={!enterBusy}
            onSubmitEditing={() => void handlePhoneEnter()}
          />
          <TouchableOpacity
            style={styles.searchEnterBtn}
            onPress={() => void handlePhoneEnter()}
            disabled={enterBusy || !searchTerm.trim()}
          >
            {enterBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Search color="#fff" size={16} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.walkInBtn}
          onPress={() => {
            onWalkIn();
            onClose();
          }}
        >
          <User color={colors.textMuted} size={18} />
          <Text style={styles.walkInText}>Walk-in Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addBtn} onPress={() => onAddNew(searchTerm.trim())}>
          <Plus color="#fff" size={18} />
          <Text style={styles.addBtnText}>Add new customer</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.sm, paddingBottom: insets.bottom + 16 }}
            ListEmptyComponent={
              <Text style={styles.empty}>No customers found. Try search or add new.</Text>
            }
            renderItem={({ item }) => {
              const active = selectedCustomer?.id === item.id;
              return (
                <Pressable
                  style={[styles.row, active && styles.rowOn]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.phoneRow}>
                      <Phone color={colors.textMuted} size={12} />
                      <Text style={styles.phone}>{item.phone || '—'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: colors.textPrimary, fontSize: 14 },
  searchEnterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.sm,
    marginBottom: 8,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  walkInText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.sm,
    marginBottom: 8,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowOn: { borderColor: colors.accentPrimary, backgroundColor: colors.accentSoft },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accentPrimary, fontWeight: '800', fontSize: 16 },
  rowBody: { flex: 1 },
  name: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phone: { color: colors.textMuted, fontSize: 12 },
});
