import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/theme/tokens';

type Props = {
  html: string;
};

/** Native (iOS/Android) invoice HTML preview. */
export function InvoiceHtmlPreview({ html }: Props) {
  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accentPrimary} size="large" />
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={styles.webview}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentPrimary} size="large" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#fff' },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
