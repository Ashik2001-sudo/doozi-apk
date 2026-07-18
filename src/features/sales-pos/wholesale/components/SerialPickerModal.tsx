import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Cpu, Search, X } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { UseWholesaleCreate } from '../hooks/useWholesaleCreate';

export function SerialPickerModal({ create }: { create: UseWholesaleCreate }) {
  const { serialPick, setSerialPick, toggleSerial, confirmSerials } = create;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!serialPick) setSearch('');
  }, [serialPick]);

  const serials = (serialPick?.variant.serialNumbers || [])
    .map((s) => (typeof s === 'string' ? s : s.serialNumber))
    .filter(Boolean) as string[];
  const filteredSerials = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? serials.filter((serial) => serial.toLowerCase().includes(query))
      : serials;
  }, [search, serials]);
  const selectedCount = serialPick?.selected.length || 0;
  const loading = !!serialPick?.loading;

  const close = () => {
    setSearch('');
    setSerialPick(null);
  };

  return (
    <Modal
      visible={!!serialPick}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Pressable style={styles.imeiModalOverlay} onPress={close}>
        <Pressable style={styles.imeiModalSheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.imeiModalHandle} />

          <View style={styles.imeiModalHeader}>
            <View style={styles.imeiModalIcon}>
              <Cpu color={colors.accentPrimary} size={23} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.imeiModalTitle}>Select IMEI / Serial</Text>
              <Text style={styles.imeiModalSub} numberOfLines={1}>
                {serialPick?.product.name}
                {serialPick?.variant.sku ? ` · ${serialPick.variant.sku}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={close}>
              <X color={colors.textPrimary} size={19} />
            </TouchableOpacity>
          </View>

          <View style={styles.imeiSelectionSummary}>
            <View>
              <Text style={styles.imeiSummaryValue}>{selectedCount}</Text>
              <Text style={styles.imeiSummaryLabel}>Selected</Text>
            </View>
            <View style={styles.imeiSummaryDivider} />
            <View>
              <Text style={styles.imeiSummaryValue}>{loading ? '…' : serials.length}</Text>
              <Text style={styles.imeiSummaryLabel}>Available</Text>
            </View>
          </View>

          <View style={styles.imeiSearchBar}>
            <Search color={colors.textMuted} size={17} />
            <TextInput
              style={styles.imeiSearchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={loading ? 'Loading...' : 'Search IMEI / serial...'}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <X color={colors.textMuted} size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.imeiEmpty}>
              <ActivityIndicator color={colors.accentPrimary} />
              <Text style={styles.imeiEmptyText}>Loading in-stock IMEIs...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.imeiScroll}
              contentContainerStyle={styles.imeiScrollContent}
              showsVerticalScrollIndicator
              persistentScrollbar
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredSerials.length ? (
                filteredSerials.map((serial) => {
                  const selected = !!serialPick?.selected.includes(serial);
                  return (
                    <TouchableOpacity
                      key={serial}
                      style={[styles.imeiOption, selected && styles.imeiOptionSelected]}
                      onPress={() => toggleSerial(serial)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.imeiCheckbox, selected && styles.imeiCheckboxSelected]}>
                        {selected ? <Check color="#ffffff" size={15} strokeWidth={3} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.imeiNumber, selected && styles.imeiNumberSelected]}>
                          {serial}
                        </Text>
                        <Text style={styles.imeiAvailableText}>Available in stock</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.imeiEmpty}>
                  <Search color={colors.textMuted} size={28} strokeWidth={1.4} />
                  <Text style={styles.imeiEmptyText}>No matching IMEI found</Text>
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.imeiModalFooter}>
            <TouchableOpacity style={styles.imeiCancelButton} onPress={close}>
              <Text style={styles.imeiCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Button
                title={`Add ${selectedCount} IMEI${selectedCount === 1 ? '' : 's'}`}
                disabled={!selectedCount || loading}
                onPress={() => {
                  setSearch('');
                  confirmSerials();
                }}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
