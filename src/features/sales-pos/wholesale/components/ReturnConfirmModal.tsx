import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Undo2 } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { money } from '../types';
import type { UseWholesaleActions } from '../hooks/useWholesaleActions';

export function ReturnConfirmModal({ actions }: { actions: UseWholesaleActions }) {
  const { returnTarget, returnBusy, closeReturn, confirmReturn } = actions;
  const item = returnTarget?.item;
  const order = returnTarget?.order;
  const totalAmount = Number(item?.totalPrice) || (item ? item.quantity * Number(item.unitPrice) : 0);
  const paidAmount = Number(item?.paidAmount) || 0;
  const hasSerials = Array.isArray(item?.serialNumbers) && (item?.serialNumbers?.length || 0) > 0;

  return (
    <Modal visible={!!returnTarget} transparent animationType="fade" onRequestClose={closeReturn}>
      <Pressable style={styles.overlay} onPress={closeReturn}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.returnIconWrap}>
            <Undo2 color={colors.statusWarning} size={30} strokeWidth={2} />
          </View>
          <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Return item</Text>
          {item && order ? (
            <>
              <Text style={[styles.modalSub, { textAlign: 'center', marginTop: 4 }]}>
                {item.productName || '—'} · {order.orderNo}
              </Text>
              <Text
                style={[styles.pickMeta, { textAlign: 'center', marginTop: 10, paddingHorizontal: 8 }]}
              >
                {hasSerials
                  ? `This restores stock & reverses payments for the full quantity (${item.quantity}).`
                  : 'This restores stock & reverses payments for this item.'}
              </Text>

              <View style={styles.returnAmountBox}>
                <Text
                  style={{
                    color: colors.statusWarning,
                    fontSize: 10,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Item Total
                </Text>
                <Text style={{ color: colors.statusWarning, fontSize: 28, fontWeight: '900', marginTop: 3 }}>
                  {money(totalAmount)}
                </Text>
                {paidAmount > 0 ? (
                  <Text style={{ color: colors.statusWarning, fontSize: 11, fontWeight: '600', marginTop: 4 }}>
                    Paid {money(paidAmount)} — will be reversed
                  </Text>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={styles.ghostBtn} onPress={closeReturn} disabled={returnBusy}>
                  <Text style={styles.ghostBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerBtn, returnBusy && { opacity: 0.6 }]}
                  onPress={() => void confirmReturn()}
                  disabled={returnBusy}
                >
                  {returnBusy ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.dangerBtnText}>Confirm Return</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
