/**
 * Store calendar dates (IANA timezone). Default Asia/Dhaka — not browser local.
 * API contract: send YYYY-MM-DD; backend interprets as store calendar day.
 */

export const DEFAULT_STORE_TIMEZONE = 'Asia/Dhaka';

function isValidTimezone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function normalizeStoreTimezone(timeZone?: string | null): string {
  if (timeZone?.trim() && isValidTimezone(timeZone.trim())) {
    return timeZone.trim();
  }
  return DEFAULT_STORE_TIMEZONE;
}

/** Civil YYYY-MM-DD in store timezone. */
export function toStoreYmd(
  d: Date,
  timeZone: string = DEFAULT_STORE_TIMEZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizeStoreTimezone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Today's date in store timezone as YYYY-MM-DD */
export function getTodayLocalDate(timeZone: string = DEFAULT_STORE_TIMEZONE): string {
  return toStoreYmd(new Date(), timeZone);
}

/** Convert Date to YYYY-MM-DD in store timezone */
export function toLocalDateString(
  d: Date,
  timeZone: string = DEFAULT_STORE_TIMEZONE,
): string {
  return toStoreYmd(d, timeZone);
}

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function zonedYmdStartToUtc(ymd: string, timeZone: string): Date {
  const tz = normalizeStoreTimezone(timeZone);
  const [y, m, d] = ymd.split('-').map(Number);
  let lo = Date.UTC(y, m - 1, d - 2);
  let hi = Date.UTC(y, m - 1, d + 2);
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (toStoreYmd(new Date(mid), tz) < ymd) lo = mid + 1;
    else hi = mid;
  }
  return new Date(lo);
}

function zonedYmdEndToUtc(ymd: string, timeZone: string): Date {
  const next = zonedYmdStartToUtc(addDaysToYmd(ymd, 1), timeZone);
  return new Date(next.getTime() - 1);
}

/**
 * YYYY-MM-DD → calendar Date at 00:00:00 (for DatePicker / react-day-picker).
 * The YMD is the store calendar day; picker uses local Date parts only for display.
 */
export function parseLocalYmdToDate(ymd: string | undefined): Date | null {
  const s = ymd?.trim();
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** End of calendar day for DatePicker max bounds. */
export function parseLocalYmdToEndOfDayDate(ymd: string | undefined): Date | null {
  const s = ymd?.trim();
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

/** Store calendar YYYY-MM-DD → UTC ISO start (for API date filters). */
export function localYmdStartToUtcIso(
  ymd: string,
  timeZone: string = DEFAULT_STORE_TIMEZONE,
): string | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) return null;
  return zonedYmdStartToUtc(ymd.trim(), timeZone).toISOString();
}

export function localYmdEndToUtcIso(
  ymd: string,
  timeZone: string = DEFAULT_STORE_TIMEZONE,
): string | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) return null;
  return zonedYmdEndToUtc(ymd.trim(), timeZone).toISOString();
}

/**
 * Payment UIs often send `YYYY-MM-DD` only; that parses as UTC midnight and can sort *before*
 * same-day sales that have a real time. Send a full ISO instant for ledger ordering.
 */
export function paymentYmdToApiIso(ymd: string, timeZone: string = DEFAULT_STORE_TIMEZONE): string {
  const s = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const today = getTodayLocalDate(timeZone);
  if (s === today) {
    return new Date().toISOString();
  }
  return zonedYmdEndToUtc(s, timeZone).toISOString();
}

export function normalizePurchaseDateRangeYmd(
  startYmd: string | undefined,
  endYmd: string | undefined,
): { startYmd: string; endYmd: string } | null {
  const s = startYmd?.trim() || '';
  const e = endYmd?.trim() || '';
  if (!s && !e) return null;
  let start = s || e;
  let end = e || s;
  if (start > end) [start, end] = [end, start];
  return { startYmd: start, endYmd: end };
}

export function formatInStoreTimezone(
  date: Date | string,
  timeZone: string = DEFAULT_STORE_TIMEZONE,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: normalizeStoreTimezone(timeZone),
    ...options,
  }).format(d);
}
