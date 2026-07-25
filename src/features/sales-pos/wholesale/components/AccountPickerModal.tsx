import React from 'react';
import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Check, Wallet, X } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { UseWholesaleActions } from '../hooks/useWholesaleActions';

export function AccountPickerModal({ actions }: { actions: UseWholesaleActions }) {
  const { accountPickerId, setAccountPickerId, sellAccounts, sellRows, setSellRowAccount } = actions;

  const used = sellRows
    .filter((r) => r.id !== accountPickerId)
    .map((r) => r.accountId)
    .filter(Boolean);
  const available = sellAccounts.filter((a) => !used.includes(a.id));
  const selectedId = sellRows.find((r) => r.id === accountPickerId)?.accountId;

  return (
    <Modal
      visible={!!accountPickerId}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setAccountPickerId(null)}
    >
      <View style={styles.sellOutOverlay}>
        <Pressable
          style={styles.sellOutBackdrop}
          onPress={() => setAccountPickerId(null)}
          accessibilityRole="button"
          accessibilityLabel="Close account picker"
        />
        <View style={styles.accountPickerSheet}>
          <View style={styles.sellOutHandle} />
          <View style={styles.accountPickerHeader}>
            <View style={styles.accountPickerTitleRow}>
              <View style={styles.accountPickerIcon}>
                <Wallet color={colors.accentPrimary} size={18} />
              </View>
              <View>
                <Text style={styles.sellOutTitle}>Select account</Text>
                <Text style={styles.sellOutSub}>
                  {available.length} available for this payment
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setAccountPickerId(null)}
              hitSlop={8}
            >
              <X color={colors.textPrimary} size={19} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={available}
            keyExtractor={(a) => a.id}
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={styles.accountPickerEmpty}>
                <Text style={styles.emptyTitle}>No accounts left</Text>
                <Text style={styles.pickMeta}>All branch accounts are already in use</Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected = selectedId === item.id;
              return (
                <TouchableOpacity
                  style={[styles.accountPickerRow, selected && styles.accountPickerRowOn]}
                  onPress={() => accountPickerId && setSellRowAccount(accountPickerId, item.id)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickName}>{item.accountName || item.name}</Text>
                    <Text style={styles.pickMeta}>
                      {[item.accountType?.replace(/_/g, ' '), item.branch?.name]
                        .filter(Boolean)
                        .join(' · ') || 'Account'}
                    </Text>
                  </View>
                  {selected ? <Check color={colors.accentPrimary} size={18} strokeWidth={3} /> : null}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
