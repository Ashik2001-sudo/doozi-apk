import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Calendar,
  Check,
  Coffee,
  CreditCard,
  Clock,
  Hash,
  List,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Sunset,
  Tag,
  Zap,
  Building2,
  MapPin,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import { useEmployeeDashboard } from '@/hooks/dashboard/useEmployeeDashboard';
import { API_BASE_URL, authorizedFetch, getMediaUrl } from '@/lib/config';
import { getTodayLocalDate, toLocalDateString } from '@/utils/date.utils';
import { geolocationErrorMessage, getCheckInPosition } from '@/utils/geolocation.utils';
import { canAccessMenuItem } from '@/utils/sidebar-permission-map';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import {
  getSessionFromStorage,
  saveSessionToStorage,
  type LocalSession,
} from '@/features/dashboard/employee/attendance-session';

interface AttendanceLog {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  totalActiveHours?: number | string | null;
  totalBreakHours?: number | string | null;
  totalHours?: number | string | null;
  shift?: { id: string; shiftName: string } | null;
  branch?: { id: string; name: string } | null;
  breaks?: Array<{
    id: string;
    breakStart: string;
    breakEnd: string;
    durationMinutes: number;
  }>;
}

const SHORTCUTS: Array<{
  id: string;
  menuId: string;
  label: string;
  href: string;
  icon: LucideIcon;
  tint: string;
}> = [
  { id: 'pos', menuId: 'sales-pos/pos', label: 'POS', href: '/admin/sales-pos/pos', icon: CreditCard, tint: '#4f46e5' },
  { id: 'quick-sell', menuId: 'sales-pos/quick-sell', label: 'Quick Sell', href: '/admin/sales-pos/quick-sell', icon: Zap, tint: '#d97706' },
  { id: 'wholesale', menuId: 'sales-pos/wholesale-management', label: 'Wholesale', href: '/admin/sales-pos/wholesale-management', icon: Building2, tint: '#7c3aed' },
  { id: 'price-list', menuId: 'inventory/price-list', label: 'Price List', href: '/admin/inventory/price-list', icon: Tag, tint: '#059669' },
  { id: 'serial', menuId: 'sales-pos/serial-number', label: 'Serial', href: '/admin/sales-pos/serial-number', icon: Hash, tint: '#0891b2' },
  { id: 'history', menuId: 'sales-pos/sales-history', label: 'History', href: '/admin/sales-pos/sales-history', icon: List, tint: '#e11d48' },
];

function formatTime(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatHours(val: number | string | null | undefined): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return Number.isNaN(n) ? '—' : `${n}h`;
}

function getGreeting(): { title: string; hint: string; Icon: LucideIcon } {
  const h = new Date().getHours();
  if (h < 5) return { title: 'Good night', hint: 'Rest well when you can', Icon: Moon };
  if (h < 12) return { title: 'Good morning', hint: 'Have a productive day', Icon: Sun };
  if (h < 17) return { title: 'Good afternoon', hint: 'Keep up the great work', Icon: Sun };
  if (h < 20) return { title: 'Good evening', hint: 'You are almost there', Icon: Sunset };
  return { title: 'Good evening', hint: 'Wind down when you can', Icon: Moon };
}

function getMonthRange(month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const endDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

function formatElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function normalizePerms(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p: any) => ({
    module: String(p.module || p.menu || ''),
    childMenu: p.childMenu,
    type: String(p.type || 'view'),
    granted: p.granted ?? p.canView !== false,
  }));
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { employee, loading: empLoading } = useEmployeeDashboard();
  const now = useMemo(() => new Date(), []);
  const monthRange = useMemo(() => getMonthRange(now), [now]);

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [overview, setOverview] = useState<{
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    onLeaveDays: number;
    month: string;
    year: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayLoaded, setTodayLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState<'checkIn' | 'checkOut' | 'break' | null>(null);
  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const [breakStart, setBreakStart] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [shifts, setShifts] = useState<{ id: string; shiftName: string }[]>([]);
  const [locationMismatchMessage, setLocationMismatchMessage] = useState<string | null>(null);
  const checkInInFlightRef = useRef(false);

  const visibleShortcuts = useMemo(() => {
    const perms = normalizePerms(user?.permissions);
    // Until permissions hydrate, still show core tiles so employees are not stuck
    if (perms.length === 0) return SHORTCUTS;
    const allowed = SHORTCUTS.filter((item) => canAccessMenuItem(item.menuId, perms, false));
    return allowed.length > 0 ? allowed : SHORTCUTS.slice(0, 2);
  }, [user?.permissions]);

  const fetchMyAttendance = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        startDate: monthRange.startDate,
        endDate: monthRange.endDate,
      });
      const res = await authorizedFetch(`${API_BASE_URL}/attendance/my?${params}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || 'Failed to fetch');
      setLogs(Array.isArray(result.data) ? result.data : []);
    } catch {
      setLogs([]);
    }
  }, [monthRange.endDate, monthRange.startDate]);

  const fetchTodayStatus = useCallback(async () => {
    setTodayLoaded(false);
    try {
      const todayLocal = getTodayLocalDate();
      const res = await authorizedFetch(`${API_BASE_URL}/attendance/my/today?date=${todayLocal}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || 'Failed');
      const data = result.data || null;
      setTodayLog((prev) => {
        if (data) return data;
        if (prev?.checkOut) return prev;
        return null;
      });
      if (data?.checkOut) {
        await saveSessionToStorage(null);
        setLocalSession(null);
      }
    } catch {
      /* keep prior state */
    } finally {
      setTodayLoaded(true);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const d = new Date();
      const y = d.getFullYear();
      const m = d.getMonth();
      const asOf = toLocalDateString(d);
      const res = await authorizedFetch(
        `${API_BASE_URL}/attendance/my/overview?year=${y}&month=${m}&asOfDate=${encodeURIComponent(asOf)}`,
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || 'Failed');
      setOverview(result.data || null);
    } catch {
      setOverview(null);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const shiftRes = await authorizedFetch(`${API_BASE_URL}/shifts`);
      if (shiftRes.ok) {
        const s = await shiftRes.json();
        setShifts(s.data || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const session = await getSessionFromStorage();
    setLocalSession(session);
    setBreakStart(session?.currentBreakStart ? new Date(session.currentBreakStart) : null);
    await fetchOverview();
    await Promise.all([fetchMyAttendance(), fetchTodayStatus(), fetchOptions()]);
    setLoading(false);
  }, [fetchMyAttendance, fetchOptions, fetchOverview, fetchTodayStatus]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!localSession?.checkIn) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [localSession?.checkIn]);

  const handleCheckIn = () => {
    if (checkInInFlightRef.current || !employee) return;
    checkInInFlightRef.current = true;
    setActionLoading('checkIn');

    const checkInTime = new Date().toISOString();
    const today = getTodayLocalDate();
    const baseSession: LocalSession = {
      date: today,
      checkIn: checkInTime,
      breaks: [],
      ...(employee.shiftId ? { shiftId: employee.shiftId } : {}),
    };

    const finish = () => {
      checkInInFlightRef.current = false;
      setActionLoading(null);
    };

    void (async () => {
      try {
        let pos = await getCheckInPosition();
        const validate = async (lat: number, lng: number) => {
          const res = await authorizedFetch(`${API_BASE_URL}/attendance/my/validate-checkin`, {
            method: 'POST',
            body: JSON.stringify({ lat, lng }),
          });
          const result = await res.json();
          if (!res.ok) {
            return { valid: false as const, message: result?.message || 'Failed to validate location.' };
          }
          const data = result?.data;
          if (data?.valid === true) {
            return { valid: true as const, branchId: data.branchId as string | undefined };
          }
          return {
            valid: false as const,
            message: data?.message || 'You are outside the allowed check-in zone.',
          };
        };

        let validation = await validate(pos.coords.latitude, pos.coords.longitude);
        if (!validation.valid && pos.coords.accuracy > 80) {
          await new Promise((r) => setTimeout(r, 1500));
          pos = await getCheckInPosition(8000);
          validation = await validate(pos.coords.latitude, pos.coords.longitude);
        }

        if (!validation.valid) {
          setLocationMismatchMessage(validation.message);
          finish();
          return;
        }

        const session: LocalSession = {
          ...baseSession,
          checkInLat: pos.coords.latitude,
          checkInLng: pos.coords.longitude,
          ...(validation.branchId ? { branchId: validation.branchId } : {}),
        };
        await saveSessionToStorage(session);
        setLocalSession(session);
        Alert.alert('Success', 'Check-in successful!');
      } catch (err) {
        Alert.alert('Check-in failed', geolocationErrorMessage(err));
      } finally {
        finish();
      }
    })();
  };

  const handleCheckOut = async () => {
    const session = (await getSessionFromStorage()) || localSession;
    if (!session) {
      Alert.alert('Check-out', 'No check-in found. Please check in first.');
      return;
    }
    setActionLoading('checkOut');
    try {
      const checkOutTime = new Date();
      let breaks = [...(session.breaks || [])];
      if (session.currentBreakStart) {
        const bs = new Date(session.currentBreakStart);
        const durationMinutes = Math.round((checkOutTime.getTime() - bs.getTime()) / 60000);
        breaks.push({
          breakStart: session.currentBreakStart,
          breakEnd: checkOutTime.toISOString(),
          durationMinutes,
        });
      }
      const body = {
        date: session.date,
        checkIn: session.checkIn,
        checkOut: checkOutTime.toISOString(),
        breaks: breaks.length ? breaks : undefined,
        branchId: session.branchId || undefined,
        shiftId: session.shiftId || undefined,
        checkInLat: session.checkInLat,
        checkInLng: session.checkInLng,
      };
      const res = await authorizedFetch(`${API_BASE_URL}/attendance/my/complete`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || 'Check-out failed');
      await saveSessionToStorage(null);
      setLocalSession(null);
      setBreakStart(null);
      if (result?.data) setTodayLog(result.data);
      await fetchOverview();
      await fetchMyAttendance();
      Alert.alert('Success', 'Check-out successful!');
    } catch (err) {
      Alert.alert('Check-out failed', err instanceof Error ? err.message : 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBreak = async () => {
    const session = (await getSessionFromStorage()) || localSession;
    if (!session) return;
    if (breakStart) {
      const breakEnd = new Date();
      const durationMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000);
      const updated: LocalSession = {
        ...session,
        breaks: [
          ...(session.breaks || []),
          { breakStart: breakStart.toISOString(), breakEnd: breakEnd.toISOString(), durationMinutes },
        ],
        currentBreakStart: undefined,
      };
      await saveSessionToStorage(updated);
      setLocalSession(updated);
      setBreakStart(null);
      Alert.alert('Break', 'Break ended.');
    } else {
      const start = new Date();
      const updated: LocalSession = { ...session, currentBreakStart: start.toISOString() };
      await saveSessionToStorage(updated);
      setLocalSession(updated);
      setBreakStart(start);
      Alert.alert('Break', 'Break started.');
    }
  };

  const todayStr = toLocalDateString(now);
  const getLogDateStr = (l: AttendanceLog) => {
    const d = l.date;
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    return toLocalDateString(new Date(d));
  };
  const todayFromLogs = logs.find((l) => getLogDateStr(l) === todayStr);
  const isInProgress = !!localSession?.checkIn;
  const isCompleted = !!(todayLog || todayFromLogs)?.checkOut;
  const canCheckIn = todayLoaded && !isInProgress && !isCompleted;
  const canCheckOut = isInProgress;
  const canBreak = isInProgress;

  const computeElapsedSeconds = () => {
    if (!localSession?.checkIn) return 0;
    void tick;
    const checkInTime = new Date(localSession.checkIn).getTime();
    const completedBreakSec = (localSession.breaks || []).reduce(
      (s, b) => s + (b.durationMinutes || 0) * 60,
      0,
    );
    if (breakStart) {
      return Math.max(0, Math.floor((breakStart.getTime() - checkInTime) / 1000) - completedBreakSec);
    }
    return Math.max(0, Math.floor((Date.now() - checkInTime) / 1000) - completedBreakSec);
  };

  const completedLog = todayLog || todayFromLogs;
  const elapsedSeconds = computeElapsedSeconds();
  const ov = overview || {
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    onLeaveDays: 0,
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    year: now.getFullYear(),
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      formatDate(log.date).toLowerCase().includes(q) ||
      (log.branch?.name || '').toLowerCase().includes(q) ||
      (log.shift?.shiftName || '').toLowerCase().includes(q) ||
      (log.status || '').toLowerCase().includes(q)
    );
  });

  const greeting = getGreeting();
  const GreetIcon = greeting.Icon;
  const photo = employee?.profilePhoto ? getMediaUrl(employee.profilePhoto) : null;

  if (empLoading && !employee) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentPrimary} size="large" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Unable to load employee profile</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 110 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void refreshAll()} tintColor={colors.accentPrimary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={['#312e81', '#4f46e5', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View style={styles.heroRow}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{(employee.name || '?').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.greetRow}>
                <View style={styles.greetIcon}>
                  <GreetIcon color="#ffffff" size={16} />
                </View>
                <Text style={styles.greetTitle}>{greeting.title}</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {employee.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {[employee.designation, employee.department?.name].filter(Boolean).join(' · ') || 'Employee'}
              </Text>
              <Text style={styles.hint}>{greeting.hint}</Text>
              <View style={styles.heroStatus}>
                <View
                  style={[
                    styles.heroStatusDot,
                    { backgroundColor: isInProgress ? '#4ade80' : isCompleted ? '#a7f3d0' : '#fbbf24' },
                  ]}
                />
                <Text style={styles.heroStatusText}>
                  {isInProgress ? 'Currently working' : isCompleted ? 'Today completed' : 'Ready to check in'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {visibleShortcuts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sales & inventory</Text>
          <View style={styles.shortcutGrid}>
            {visibleShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.shortcut, shadows.soft, { borderTopColor: item.tint }]}
                  onPress={() => router.push(item.href as never)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.shortcutIcon, { backgroundColor: `${item.tint}18` }]}>
                    <Icon color={item.tint} size={22} />
                  </View>
                  <Text style={styles.shortcutLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={[styles.card, shadows.soft]}>
        <View style={styles.cardHead}>
          <View style={styles.cardIcon}>
            <Calendar color={colors.accentPrimary} size={16} />
          </View>
          <Text style={styles.cardTitle}>
            Overview — {ov.month} {ov.year}
          </Text>
        </View>
        <View style={styles.statGrid}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Work days</Text>
            <Text style={styles.statValue}>{ov.totalWorkingDays}</Text>
          </View>
          <View style={[styles.stat, styles.statPresent]}>
            <Text style={[styles.statLabel, { color: '#059669' }]}>Present</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{ov.presentDays}</Text>
          </View>
          <View style={[styles.stat, styles.statAbsent]}>
            <Text style={[styles.statLabel, { color: '#e11d48' }]}>Absent</Text>
            <Text style={[styles.statValue, { color: '#e11d48' }]}>{ov.absentDays}</Text>
          </View>
          <View style={[styles.stat, styles.statLeave]}>
            <Text style={[styles.statLabel, { color: '#d97706' }]}>On leave</Text>
            <Text style={[styles.statValue, { color: '#d97706' }]}>{ov.onLeaveDays}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, shadows.soft]}>
        <View style={styles.cardHead}>
          <View style={styles.cardIcon}>
            <Clock color={colors.accentPrimary} size={16} />
          </View>
          <Text style={styles.cardTitle}>Quick actions</Text>
        </View>

        <View style={styles.timerBox}>
          {isCompleted && completedLog ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.completeTitle}>Complete</Text>
              <Text style={styles.completeMeta}>
                In {formatTime(completedLog.checkIn)} → Out {formatTime(completedLog.checkOut)}
              </Text>
            </View>
          ) : isInProgress ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.timerLabel}>Working time</Text>
              <Text style={styles.timerValue}>{formatElapsed(elapsedSeconds)}</Text>
              {breakStart ? <Text style={styles.breakHint}>On break — timer paused</Text> : null}
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.timerLabel}>Today's status</Text>
              <Text style={styles.notIn}>Not checked in</Text>
              <Text style={styles.hintSmall}>Tap Check in to start</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              canCheckIn && styles.btnCheckIn,
              canCheckOut && styles.btnCheckOut,
              isCompleted && styles.btnDisabled,
            ]}
            disabled={(!todayLoaded && !isInProgress) || isCompleted || actionLoading !== null}
            onPress={() => {
              if (canCheckIn) handleCheckIn();
              else if (canCheckOut) void handleCheckOut();
            }}
          >
            {actionLoading === 'checkIn' || actionLoading === 'checkOut' ? (
              <ActivityIndicator color="#fff" />
            ) : canCheckOut ? (
              <>
                <LogOut color="#fff" size={16} />
                <Text style={styles.actionText}>Check out</Text>
              </>
            ) : !todayLoaded ? (
              <Text style={styles.actionText}>Loading…</Text>
            ) : canCheckIn ? (
              <>
                <LogIn color="#fff" size={16} />
                <Text style={styles.actionText}>Check in</Text>
              </>
            ) : (
              <>
                <Check color="#fff" size={16} />
                <Text style={styles.actionText}>Done</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              canBreak ? (breakStart ? styles.btnEndBreak : styles.btnBreak) : styles.btnDisabled,
            ]}
            disabled={!canBreak || actionLoading !== null}
            onPress={() => void handleBreak()}
          >
            <Coffee color="#fff" size={16} />
            <Text style={styles.actionText}>{breakStart ? 'End break' : 'Break'}</Text>
          </TouchableOpacity>
        </View>

        {canCheckIn && employee.shiftId ? (
          <Text style={styles.shiftNote}>
            Shift: {shifts.find((s) => s.id === employee.shiftId)?.shiftName || 'Assigned'}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Attendance log</Text>
        <TextInput
          style={styles.search}
          placeholder="Search date, branch, shift…"
          placeholderTextColor={colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {filteredLogs.length === 0 ? (
          <Text style={styles.empty}>No attendance records this month</Text>
        ) : (
          filteredLogs.slice(0, 30).map((log) => (
            <View key={log.id} style={[styles.logRow, shadows.soft]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logDate}>{formatDate(log.date)}</Text>
                <Text style={styles.logMeta}>
                  {formatTime(log.checkIn)} – {formatTime(log.checkOut)} · {formatHours(log.totalActiveHours)}
                </Text>
                {(log.branch?.name || log.shift?.shiftName) ? (
                  <Text style={styles.logBranch}>
                    {[log.branch?.name, log.shift?.shiftName].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.statusPill, log.status === 'present' && styles.statusPresent]}>
                <Text style={styles.statusText}>{log.status || '—'}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={locationMismatchMessage !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLocationMismatchMessage(null)}
      >
        <View style={styles.locationModalOverlay}>
          <View style={[styles.locationModalCard, shadows.soft]}>
            <View style={styles.locationModalIcon}>
              <MapPin color="#dc2626" size={28} />
            </View>
            <Text style={styles.locationModalTitle}>Location not matched</Text>
            <Text style={styles.locationModalText}>
              {locationMismatchMessage || 'You are outside the allowed check-in zone.'}
            </Text>
            <Text style={styles.locationModalHint}>
              Move closer to your assigned branch and turn on precise location, then try again.
            </Text>
            <View style={styles.locationModalActions}>
              <TouchableOpacity
                style={[styles.locationModalButton, styles.locationModalCancel]}
                onPress={() => setLocationMismatchMessage(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.locationModalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationModalButton, styles.locationModalRetry]}
                onPress={() => {
                  setLocationMismatchMessage(null);
                  setTimeout(handleCheckIn, 250);
                }}
                activeOpacity={0.8}
              >
                <RotateCcw color="#ffffff" size={16} />
                <Text style={styles.locationModalRetryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  locationModalOverlay: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  locationModalCard: {
    width: '100%',
    maxWidth: 370,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
  },
  locationModalIcon: {
    width: 58,
    height: 58,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  locationModalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  locationModalText: {
    marginTop: 9,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  locationModalHint: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  locationModalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  locationModalButton: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  locationModalCancel: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgPrimary,
  },
  locationModalCancelText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  locationModalRetry: { backgroundColor: colors.accentPrimary },
  locationModalRetryText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    right: -55,
    top: -75,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    right: 45,
    bottom: -60,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '800' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greetIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  greetTitle: { color: '#e0e7ff', fontWeight: '700', fontSize: 13 },
  name: { color: '#ffffff', fontSize: 21, fontWeight: '900', marginTop: 4 },
  meta: { color: 'rgba(255,255,255,0.76)', fontSize: 13, marginTop: 2 },
  hint: { color: 'rgba(255,255,255,0.64)', fontSize: 11, marginTop: 4 },
  heroStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  heroStatusDot: { width: 6, height: 6, borderRadius: 3 },
  heroStatusText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shortcut: {
    width: '31%',
    flexGrow: 1,
    maxWidth: '32%',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderTopWidth: 3,
    minHeight: 92,
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutLabel: { color: colors.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statPresent: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statAbsent: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  statLeave: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  statValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  timerBox: {
    minHeight: 118,
    borderRadius: radius.lg,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 12,
  },
  timerLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  timerValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    marginTop: 4,
  },
  breakHint: { color: '#d97706', fontWeight: '600', marginTop: 6, fontSize: 12 },
  completeTitle: { color: '#059669', fontSize: 28, fontWeight: '800' },
  completeMeta: { color: colors.textMuted, marginTop: 6, fontSize: 13 },
  notIn: { color: colors.textMuted, fontSize: 18, fontWeight: '700', marginTop: 4 },
  hintSmall: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnCheckIn: { backgroundColor: '#059669' },
  btnCheckOut: { backgroundColor: '#e11d48' },
  btnBreak: { backgroundColor: '#0891b2' },
  btnEndBreak: { backgroundColor: '#d97706' },
  btnDisabled: { backgroundColor: '#94a3b8' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shiftNote: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 16 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  logDate: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  logMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  logBranch: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
  },
  statusPresent: { backgroundColor: '#d1fae5' },
  statusText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
