import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Undo2 } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { UseWholesaleActions } from '../hooks/useWholesaleActions';

export function ReturnConfirmModal({ actions }: { actions: UseWholesaleActions }) {
  const { returnTarget, returnBusy, returnQty, setReturnQty, closeReturn, confirmReturn } = actions;
  const item = returnTarget?.item;
  const order = returnTarget?.order;

  const serials = Array.isArray(item?.serialNumbers) ? item?.serialNumbers ?? [] : [];
  const hasSerials = serials.length > 0;
  const maxQty = item?.quantity ?? 0;
  // Non-serial pending items with multiple units can be partially returned
  const isVariableQty = !hasSerials && maxQty > 1;
  const returnQtyNum = returnQty.trim() === '' ? 0 : parseInt(returnQty, 10);
  const canPartial =
    isVariableQty && !isNaN(returnQtyNum) && returnQtyNum >= 1 && returnQtyNum < maxQty;

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
                {isVariableQty
                  ? `Not sold yet — removes from order (partial or all ${maxQty}).`
                  : 'Not sold yet — removes from order. No stock/payment change.'}
              </Text>

              {isVariableQty ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.sectionLabel}>Return qty (partial return)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder={`1 to ${maxQty}`}
                    placeholderTextColor={colors.textMuted}
                    value={returnQty}
                    onChangeText={(v) => setReturnQty(v.replace(/[^0-9]/g, ''))}
                    editable={!returnBusy}
                  />
                </View>
              ) : null}

              {isVariableQty ? (
                <View style={{ gap: 10, marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.dangerBtn, (returnBusy || !canPartial) && { opacity: 0.5 }]}
                      onPress={() => void confirmReturn(returnQtyNum)}
                      disabled={returnBusy || !canPartial}
                    >
                      {returnBusy ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.dangerBtnText}>
                          Return {returnQtyNum || '?'} units
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dangerBtn, returnBusy && { opacity: 0.6 }]}
                      onPress={() => void confirmReturn()}
                      disabled={returnBusy}
                    >
                      {returnBusy ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.dangerBtnText}>Return all</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.ghostBtn} onPress={closeReturn} disabled={returnBusy}>
                    <Text style={styles.ghostBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
              )}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
