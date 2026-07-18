import React from 'react';
import { Redirect } from 'expo-router';

/** Standalone POS route — mirrors web /pos */
export default function StandalonePOSPage() {
  return <Redirect href="/admin/sales-pos/pos" />;
}
