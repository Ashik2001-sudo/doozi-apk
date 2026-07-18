import React from 'react';
import { AdminScreenShell } from '@/components/common/AdminScreenShell';

export default function Page() {
  return (
    <AdminScreenShell
      title="Id"
      routePath="/admin/purchases/purchase-return/[id]"
      dynamic
    />
  );
}
