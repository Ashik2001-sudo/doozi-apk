/** Extract user-facing message from contact delete API responses. */
export function getContactDeleteErrorMessage(
  result: { message?: unknown; error?: unknown },
  fallback: string,
): string {
  if (typeof result.message === 'string' && result.message.trim()) {
    return result.message;
  }
  if (Array.isArray(result.message) && result.message.length > 0) {
    return result.message.map(String).join(', ');
  }
  if (typeof result.error === 'string' && result.error.trim()) {
    return result.error;
  }
  return fallback;
}
