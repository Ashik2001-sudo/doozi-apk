import React from 'react';
import { AdminScreenShell } from '@/components/common/AdminScreenShell';

export default function Page() {
  return (
    <AdminScreenShell
      title="Id"
      routePath="/admin/stock/stock-adjustment/[id]"
      dynamic
    />
  );
}
