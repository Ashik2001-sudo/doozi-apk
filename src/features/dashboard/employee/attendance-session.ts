import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayLocalDate } from '@/utils/date.utils';

export const ATTENDANCE_SESSION_KEY = 'attendance_session';

export interface LocalSession {
  date: string;
  checkIn: string;
  breaks: Array<{ breakStart: string; breakEnd: string; durationMinutes?: number }>;
  currentBreakStart?: string;
  branchId?: string;
  shiftId?: string;
  checkInLat?: number;
  checkInLng?: number;
}

export async function getSessionFromStorage(): Promise<LocalSession | null> {
  try {
    const raw = await AsyncStorage.getItem(ATTENDANCE_SESSION_KEY);
    if (!raw) return null;
    const session: LocalSession = JSON.parse(raw);
    const today = getTodayLocalDate();
    if (session?.date !== today || !session?.checkIn) return null;
    return session;
  } catch {
    return null;
  }
}

export async function saveSessionToStorage(session: LocalSession | null): Promise<void> {
  if (session) await AsyncStorage.setItem(ATTENDANCE_SESSION_KEY, JSON.stringify(session));
  else await AsyncStorage.removeItem(ATTENDANCE_SESSION_KEY);
}
