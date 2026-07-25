import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type KeyboardAwareProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra offset (e.g. header / status bar). Mostly for iOS. */
  offset?: number;
};

/**
 * Keeps focused inputs above the soft keyboard on both iOS and Android.
 * Android fullscreen Modals often ignore windowSoftInputMode — we pad by
 * keyboard height instead of relying on KeyboardAvoidingView alone.
 */
export function KeyboardAware({ children, style, offset = 0 }: KeyboardAwareProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior="padding"
        keyboardVerticalOffset={offset}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={[
        styles.flex,
        style,
        keyboardHeight > 0 ? { paddingBottom: Math.max(0, keyboardHeight - offset) } : null,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
