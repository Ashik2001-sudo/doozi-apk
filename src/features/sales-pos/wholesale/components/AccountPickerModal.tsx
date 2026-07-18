import React from 'react';
import { FlatList, Modal, Pressable, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import type { UseWholesaleActions } from '../hooks/useWholesaleActions';

export function AccountPickerModal({ actions }: { actions: UseWholesaleActions }) {
  const { accountPickerId, setAccountPickerId, sellAccounts, sellRows, setSellRowAccount } = actions;

  const used = sellRows
    .filter((r) => r.id !== accountPickerId)
    .map((r) => r.accountId)
    .filter(Boolean);
  const available = sellAccounts.filter((a) => !used.includes(a.id));

  return (
    <Modal
      visible={!!accountPickerId}
      transparent
      animationType="fade"
      onRequestClose={() => setAccountPickerId(null)}
    >
      <Pressable style={styles.overlay} onPress={() => setAccountPickerId(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Select account</Text>
          <FlatList
            data={available}
            keyExtractor={(a) => a.id}
            style={{ maxHeight: 360, marginTop: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickRow}
                onPress={() => accountPickerId && setSellRowAccount(accountPickerId, item.id)}
              >
                <Text style={styles.pickName}>
                  {item.accountName || item.name}
                  {item.accountType ? ` (${item.accountType})` : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
