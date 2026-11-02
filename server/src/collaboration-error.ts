/** Hocuspocus forwards error.code to ws.close. Driver/network codes are strings,
 * which ws rejects with an uncaught TypeError. Keep that transport boundary numeric
 * and private while preserving authentication denial and retryable failures. */
export function collaborationError(error: unknown, fallback = 4403) {
  const value = error as {
    code?: unknown;
    cause?: { code?: unknown };
    getStatus?: () => number;
  } | null;
  const status =
    typeof value?.getStatus === 'function' ? value.getStatus() : undefined;
  const supplied = value?.code;
  const valid =
    typeof supplied === 'number' &&
    Number.isInteger(supplied) &&
    ((supplied >= 1000 &&
      supplied <= 1014 &&
      ![1004, 1005, 1006].includes(supplied)) ||
      (supplied >= 3000 && supplied <= 4999));
  const code =
    status === 401
      ? 4401
      : status === 403
        ? 4403
        : status === 404
          ? 4404
          : valid
            ? supplied
            : (status && status >= 500) ||
                typeof supplied === 'string' ||
                typeof value?.cause?.code === 'string'
              ? 1013
              : fallback;
  const reason =
    code === 1013
      ? 'Collaboration temporarily unavailable. Reconnect to retry.'
      : 'Session or document access is unavailable.';
  return Object.assign(new Error(reason), { code, reason });
}
