import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = {
  html: string;
};

/** Web fallback — react-native-webview is unsupported on web. */
export function InvoiceHtmlPreview({ html }: Props) {
  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accentPrimary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {React.createElement('iframe', {
        title: 'Invoice preview',
        srcDoc: html,
        style: {
          border: '0',
          width: '100%',
          height: '100%',
          background: '#ffffff',
        },
        sandbox: 'allow-scripts allow-same-origin',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
