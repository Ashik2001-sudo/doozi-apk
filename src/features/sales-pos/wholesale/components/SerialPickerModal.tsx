import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { styles } from '../styles';
import type { UseWholesaleCreate } from '../hooks/useWholesaleCreate';

export function SerialPickerModal({ create }: { create: UseWholesaleCreate }) {
  const { serialPick, setSerialPick, toggleSerial, confirmSerials } = create;

  const serials = (serialPick?.variant.serialNumbers || [])
    .map((s) => (typeof s === 'string' ? s : s.serialNumber))
    .filter(Boolean) as string[];

  return (
    <Modal
      visible={!!serialPick}
      transparent
      animationType="fade"
      onRequestClose={() => setSerialPick(null)}
    >
      <Pressable style={styles.overlay} onPress={() => setSerialPick(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Select IMEI / Serial</Text>
          <Text style={[styles.modalSub, { marginBottom: 10 }]}>
            {serialPick?.product.name} · {serialPick?.selected.length || 0} selected
          </Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {serials.map((sn) => {
              const on = !!serialPick?.selected.includes(sn);
              return (
                <TouchableOpacity
                  key={sn}
                  style={[styles.pickRow, on && styles.pickRowOn]}
                  onPress={() => toggleSerial(sn)}
                >
                  <Text style={styles.pickName}>{sn}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Button
            title={`Add ${serialPick?.selected.length || 0} serial(s)`}
            disabled={!serialPick?.selected.length}
            onPress={confirmSerials}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
