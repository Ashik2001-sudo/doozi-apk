import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse NestJS-style JSON error from a failed fetch (message string or array). */
export async function fetchErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const m = body?.message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m) && m.length) return String(m[0]);
  return fallback;
}
