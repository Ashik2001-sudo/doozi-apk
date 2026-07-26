import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, LogOut, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, config } from '@/lib/config';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

interface Subscription {
  status?: string;
  planName?: string;
  isTrial?: boolean;
  trialEndsAt?: string | null;
  endDate?: string | null;
}

type AccessState =
  | { kind: 'checking' }
  | { kind: 'allowed'; expiresAt: number }
  | { kind: 'blocked'; reason: 'missing' | 'expired' | 'verification'; planName?: string };

export function SubscriptionAccessGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { user, isReady, logout } = useAuth();
  const [access, setAccess] = useState<AccessState>({ kind: 'checking' });
  const [retrying, setRetrying] = useState(false);
  const requestId = useRef(0);
  const accessRef = useRef(access);
  accessRef.current = access;

  const checkSubscription = useCallback(async (opts?: { silent?: boolean; fromBlocked?: boolean }) => {
    const currentRequest = ++requestId.current;
    const previous = accessRef.current.kind;
    const silent = opts?.silent === true && previous === 'allowed';
    const fromBlocked = opts?.fromBlocked === true || previous === 'blocked';

    if (user?.role === 'super_admin') {
      setRetrying(false);
      setAccess({ kind: 'allowed', expiresAt: Number.POSITIVE_INFINITY });
      return;
    }

    // Never unmount the admin Slot while re-checking. Unmounting it makes Expo Router
    // fall back to the first admin route alphabetically: /admin/ask-me.
    if (fromBlocked) {
      setRetrying(true);
    } else if (!silent && previous !== 'allowed' && previous !== 'checking') {
      setAccess({ kind: 'checking' });
    }

    try {
      const result = await apiFetch<Subscription>(config.ENDPOINTS.TENANT.SUBSCRIPTION_STATUS);
      if (currentRequest !== requestId.current) return;

      const subscription = result.success ? result.data : undefined;
      if (!subscription) {
        setAccess({ kind: 'blocked', reason: 'missing' });
        return;
      }

      const effectiveDate =
        subscription.isTrial && subscription.trialEndsAt
          ? subscription.trialEndsAt
          : subscription.endDate;
      const expiresAt = effectiveDate ? new Date(effectiveDate).getTime() : Number.NaN;
      const status = String(subscription.status || '').toLowerCase();

      if (
        !Number.isFinite(expiresAt) ||
        expiresAt <= Date.now() ||
        status === 'expired' ||
        status === 'cancelled'
      ) {
        setAccess({
          kind: 'blocked',
          reason: Number.isFinite(expiresAt) ? 'expired' : 'missing',
          planName: subscription.planName,
        });
        return;
      }

      setAccess({ kind: 'allowed', expiresAt });
    } catch {
      if (currentRequest === requestId.current) {
        setAccess({ kind: 'blocked', reason: 'verification' });
      }
    } finally {
      if (currentRequest === requestId.current) {
        setRetrying(false);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    if (!isReady || !user) return;
    void checkSubscription();
  }, [checkSubscription, isReady, user]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isReady && user) {
        void checkSubscription({ silent: true });
      }
    });
    return () => subscription.remove();
  }, [checkSubscription, isReady, user]);

  useEffect(() => {
    if (access.kind !== 'allowed' || !Number.isFinite(access.expiresAt)) return;
    const timer = setInterval(() => {
      if (Date.now() >= access.expiresAt) {
        setAccess({ kind: 'blocked', reason: 'expired' });
      }
    }, 30_000);
    return () => clearInterval(timer);
  }, [access]);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  // Keep Slot mounted during the first check / while allowed so the current URL is preserved.
  if (access.kind === 'allowed' || access.kind === 'checking') {
    return (
      <View style={styles.root}>
        {children}
        {access.kind === 'checking' ? (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator color={colors.accentPrimary} size="large" />
            <Text style={styles.loadingText}>Checking subscription...</Text>
          </View>
        ) : null}
      </View>
    );
  }

  const isVerificationError = access.reason === 'verification';
  const isEmployee = user?.role === 'employee';
  const title = isVerificationError
    ? 'Unable to verify subscription'
    : access.reason === 'missing'
      ? 'Subscription required'
      : access.planName
        ? `${access.planName} has expired`
        : 'Subscription expired';
  const message = isVerificationError
    ? 'We could not confirm your subscription. Check your internet connection and try again.'
    : isEmployee
      ? 'Access is suspended. Please contact your account owner to renew the subscription.'
      : 'This account has no valid subscription date. Please renew or contact support to continue.';
  const WarningIcon = isVerificationError ? WifiOff : ShieldAlert;

  return (
    <LinearGradient
      colors={['#eef2ff', '#f8fafc', '#fff7ed']}
      style={[
        styles.blockedScreen,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      <View style={[styles.card, shadows.soft]}>
        <View style={[styles.iconWrap, isVerificationError && styles.offlineIconWrap]}>
          <WarningIcon
            color={isVerificationError ? colors.statusWarning : colors.statusError}
            size={38}
            strokeWidth={2}
          />
        </View>
        <Text style={styles.eyebrow}>{config.APP_NAME.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {!isVerificationError ? (
          <View style={styles.warning}>
            <AlertTriangle color={colors.statusWarning} size={18} />
            <Text style={styles.warningText}>
              All app features are locked until a valid subscription date is available.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => void checkSubscription({ fromBlocked: true })}
          activeOpacity={0.8}
          accessibilityRole="button"
          disabled={retrying}
        >
          {retrying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <RefreshCw color="#ffffff" size={18} />
          )}
          <Text style={styles.primaryButtonText}>{retrying ? 'Checking...' : 'Check again'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => void logout()}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <LogOut color={colors.textSecondary} size={18} />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.bgPrimary,
  },
  loadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  blockedScreen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 76,
    height: 76,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  offlineIconWrap: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  eyebrow: {
    color: colors.accentPrimary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 7,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  warning: {
    width: '100%',
    marginTop: 20,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    flex: 1,
    color: '#92400e',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  logoutButton: {
    width: '100%',
    height: 46,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logoutButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
});
