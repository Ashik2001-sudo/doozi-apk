import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { Eye, EyeOff, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const orb = useSharedValue(0);

  useEffect(() => {
    orb.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [orb]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orb.value * 14 }, { scale: 1 + orb.value * 0.05 }],
    opacity: 0.5 + orb.value * 0.2,
  }));

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Email/phone and password are required');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#eef2ff', '#f8fafc', '#faf5ff', '#ffffff']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbClip} pointerEvents="none">
        <Animated.View style={[styles.orb, styles.orbA, orbStyle]} />
        <Animated.View style={[styles.orb, styles.orbB, orbStyle]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          bounces={false}
          overScrollMode="never"
        >
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.brand}>
            <View style={[styles.logoMark, shadows.glow]}>
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.logoGradient}>
                <Sparkles color="#fff" size={28} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Seller Admin</Text>
            <Text style={styles.tagline}>Your business, anywhere</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(160).duration(650)} style={[styles.formCard, shadows.soft]}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSub}>Sign in to continue to your store</Text>

            <Input
              label="Email or Phone"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@shop.com"
            />
            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeBtn}
                hitSlop={12}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Button title="Sign In" loading={loading} onPress={handleLogin} size="lg" />
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(320).duration(500)} style={styles.footer}>
            Same account as seller-admin web
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.bgPrimary,
    overflow: 'hidden',
  },
  orbClip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: {
    width: width * 0.7,
    height: width * 0.7,
    top: -width * 0.15,
    right: -width * 0.2,
    backgroundColor: 'rgba(99,102,241,0.14)',
  },
  orbB: {
    width: width * 0.55,
    height: width * 0.55,
    bottom: width * 0.05,
    left: -width * 0.2,
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  keyboard: { flex: 1, width: '100%' },
  scrollView: { flex: 1, width: '100%' },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: '100%',
    justifyContent: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logoMark: { marginBottom: spacing.md },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tagline: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    width: '100%',
    alignSelf: 'stretch',
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSub: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 42,
    zIndex: 2,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  error: { color: colors.statusError, fontSize: 13 },
  footer: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 12,
  },
});
