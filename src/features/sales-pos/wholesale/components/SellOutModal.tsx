import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { money } from '../types';
import type { UseWholesaleActions } from '../hooks/useWholesaleActions';

export function SellOutModal({ actions }: { actions: UseWholesaleActions }) {
  const {
    sellItem,
    sellPrice,
    setSellPrice,
    sellRows,
    sellAdvance,
    sellBusy,
    sellAccounts,
    sellPaid,
    sellItemTotal,
    setAccountPickerId,
    closeSellOut,
    addSellRow,
    setSellRowAmount,
    payFull,
    applyAdvance,
    confirmSellOut,
  } = actions;

  const advanceBalance = Number(sellItem?.order.retailer?.advanceBalance || 0);

  return (
    <Modal visible={!!sellItem} transparent animationType="slide" onRequestClose={closeSellOut}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: '88%' }]}>
          <View style={styles.modalHead}>
            <View>
              <Text style={styles.modalTitle}>Sell Out</Text>
              <Text style={styles.modalSub} numberOfLines={1}>
                {sellItem?.item.productName}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeSellOut}>
              <X color={colors.textPrimary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.pickMeta}>
              Qty {sellItem?.item.quantity} · {sellItem?.order.retailer?.name || sellItem?.order.retailerName}
            </Text>

            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Unit price</Text>
            <TextInput
              style={styles.input}
              value={sellPrice}
              onChangeText={setSellPrice}
              keyboardType="decimal-pad"
            />

            <Text style={styles.sectionLabel}>Payment</Text>
            {sellRows.map((row) => {
              const acc = sellAccounts.find((a) => a.id === row.accountId);
              return (
                <View key={row.id} style={{ marginBottom: 8 }}>
                  <TouchableOpacity style={styles.input} onPress={() => setAccountPickerId(row.id)}>
                    <Text style={{ color: acc ? colors.textPrimary : colors.textMuted }}>
                      {acc?.accountName || acc?.name || 'Select account'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    value={row.amount === '' ? '' : String(row.amount)}
                    onChangeText={(v) =>
                      setSellRowAmount(row.id, v === '' ? '' : parseFloat(v) || 0)
                    }
                    keyboardType="decimal-pad"
                    placeholder="Amount"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              );
            })}
            <TouchableOpacity onPress={addSellRow}>
              <Text style={styles.link}>+ Add account</Text>
            </TouchableOpacity>

            {advanceBalance > 0 ? (
              <TouchableOpacity style={{ marginTop: 10 }} onPress={applyAdvance}>
                <Text style={styles.link}>
                  Use advance ({money(advanceBalance)})
                  {sellAdvance > 0 ? ` · applied ${money(sellAdvance)}` : ''}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.summaryBox}>
              <Text style={styles.pickMeta}>Item total: {money(sellItemTotal)}</Text>
              <Text style={styles.pickMeta}>Received: {money(sellPaid)}</Text>
              <Text style={styles.pickMeta}>Due: {money(Math.max(0, sellItemTotal - sellPaid))}</Text>
            </View>

            <TouchableOpacity onPress={payFull}>
              <Text style={[styles.link, { marginBottom: 12 }]}>Pay full</Text>
            </TouchableOpacity>

            <Button title="Confirm Sell Out" loading={sellBusy} onPress={() => void confirmSellOut()} />
            <Text style={[styles.pickMeta, { marginTop: 8, textAlign: 'center' }]}>
              You can also sell out with 0 payment (full due)
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
