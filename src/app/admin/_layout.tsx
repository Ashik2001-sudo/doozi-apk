import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutDashboard, ShoppingCart, Zap, LogOut, Store } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionAccessGate } from '@/components/SubscriptionAccessGate';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

const TAB_ITEMS = [
  { href: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/admin/sales-pos/pos', label: 'POS', icon: ShoppingCart },
  { href: '/admin/sales-pos/quick-sell', label: 'Quick Sell', icon: Zap },
];

export default function AdminLayout() {
  return (
    <SubscriptionAccessGate>
      <AdminLayoutContent />
    </SubscriptionAccessGate>
  );
}

function AdminLayoutContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = (href: string) => {
    router.push(href as never);
  };

  const isActiveTab = (href: string) => pathname.startsWith(href);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#312e81', '#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }, shadows.soft]}
      >
        <View style={styles.brandIcon}>
          <Store color="#ffffff" size={20} strokeWidth={2.2} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>SELLER ADMIN</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tenant?.company || 'Seller Admin'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {user?.name || user?.email}
            {user?.role ? ` · ${user.role.replace('_', ' ')}` : ''}
          </Text>
        </View>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={['#ffffff', '#e0e7ff']} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <LogOut color="#ffffff" size={19} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        <Slot />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <View style={styles.tabBar}>
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const active = isActiveTab(tab.href);
            const isPrimary = tab.label === 'POS';
            return (
              <TouchableOpacity
                key={tab.href}
                style={[styles.tab, isPrimary && styles.primaryTab]}
                onPress={() => navigate(tab.href)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {isPrimary ? (
                  <LinearGradient
                    colors={active ? ['#7c3aed', '#4f46e5'] : ['#6366f1', '#4338ca']}
                    style={[styles.primaryIcon, active && styles.primaryIconActive]}
                  >
                    <Icon color="#ffffff" size={23} strokeWidth={2.4} />
                  </LinearGradient>
                ) : active ? (
                  <LinearGradient
                    colors={['#eef2ff', '#e0e7ff']}
                    style={styles.tabActivePill}
                  >
                    <Icon color={colors.accentPrimary} size={20} strokeWidth={2.4} />
                  </LinearGradient>
                ) : (
                  <View style={styles.tabIconWrap}>
                    <Icon color={colors.textMuted} size={20} strokeWidth={2} />
                  </View>
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                    isPrimary && styles.primaryLabel,
                  ]}
                >
                  {tab.label}
                </Text>
                {active && !isPrimary ? <View style={styles.activeDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.soft]}>
            <View style={styles.modalIcon}>
              <LogOut color="#dc2626" size={26} />
            </View>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalAction, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAction, styles.confirmButton]}
                onPress={() => void confirmLogout()}
                activeOpacity={0.8}
              >
                <LogOut color="#ffffff" size={17} />
                <Text style={styles.confirmButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    marginRight: 11,
  },
  headerCenter: { flex: 1 },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  headerTitle: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: -0.2 },
  headerSub: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarText: { color: '#4338ca', fontWeight: '900', fontSize: 16 },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  body: { flex: 1 },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 50,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingTop: 8,
    paddingBottom: 7,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 18,
  },
  tab: {
    flex: 1,
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    position: 'relative',
  },
  primaryTab: {
    minHeight: 60,
  },
  tabActivePill: {
    width: 48,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  tabIconWrap: {
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIcon: {
    width: 54,
    height: 54,
    marginTop: -22,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryIconActive: {
    transform: [{ scale: 1.06 }],
  },
  tabLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  tabLabelActive: { color: colors.accentPrimary, fontWeight: '800' },
  primaryLabel: { color: colors.accentPrimary, fontWeight: '800' },
  activeDot: {
    width: 4,
    height: 4,
    marginTop: 1,
    borderRadius: 2,
    backgroundColor: colors.accentPrimary,
  },
  modalOverlay: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
  },
  modalIcon: {
    width: 54,
    height: 54,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  modalText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  modalAction: {
    flex: 1,
    minWidth: 0,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  cancelButton: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cancelButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  confirmButton: { backgroundColor: '#dc2626' },
  confirmButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
