import React from 'react';
import { View } from 'react-native';
import { styles } from './styles';
import { useWholesaleOrders } from './hooks/useWholesaleOrders';
import { useWholesaleCreate } from './hooks/useWholesaleCreate';
import { useWholesaleActions } from './hooks/useWholesaleActions';
import { WholesaleList } from './components/WholesaleList';
import { AddOrderModal } from './components/AddOrderModal';
import { SerialPickerModal } from './components/SerialPickerModal';
import { BarcodeScannerModal } from '@/features/sales-pos/pos/components/BarcodeScannerModal';
import { AddRetailerModal } from './components/AddRetailerModal';
import { SellOutModal } from './components/SellOutModal';
import { AccountPickerModal } from './components/AccountPickerModal';
import { ReturnConfirmModal } from './components/ReturnConfirmModal';

export function WholesaleScreen() {
  const orders = useWholesaleOrders();
  const create = useWholesaleCreate(orders.branchId, orders.refresh);
  const actions = useWholesaleActions({
    accountsForBranch: orders.accountsForBranch,
    refresh: orders.refresh,
  });

  return (
    <View style={styles.root}>
      <WholesaleList
        orders={orders}
        onCreate={create.openModal}
        onSellOut={actions.openSellOut}
        onReturn={actions.openReturn}
      />

      <AddOrderModal create={create} />
      <AddRetailerModal create={create} />
      <BarcodeScannerModal
        visible={create.scannerOpen}
        onClose={() => create.setScannerOpen(false)}
        onScan={(value) => {
          create.setScannerOpen(false);
          create.setProductQ(value);
          void create.addByCode(value);
        }}
      />
      <SerialPickerModal create={create} />
      <SellOutModal actions={actions} />
      <AccountPickerModal actions={actions} />
      <ReturnConfirmModal actions={actions} />
    </View>
  );
}
