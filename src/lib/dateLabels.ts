export function relativeDateLabel(timestamp?: number): string {
  if (!timestamp) {
    return '-';
  }

  const days = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  if (days === 0) {
    return '今日';
  }
  if (days === 1) {
    return '1日前';
  }
  if (days < 7) {
    return `${days}日前`;
  }
  if (days < 31) {
    return `${Math.floor(days / 7)}週間前`;
  }
  return `${Math.floor(days / 30)}ヶ月前`;
}

export function monthDayLabel(timestamp?: number): string {
  if (!timestamp) {
    return '-';
  }

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function daysBetweenLabel(from: number, to?: number): string {
  const days = Math.max(0, Math.floor(((to ?? Date.now()) - from) / (1000 * 60 * 60 * 24)));
  return `${days}日間`;
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a stored `YYYY-MM-DD` value back into a local-midnight Date for the
 * date picker. Returns null for empty/malformed values and for impossible
 * calendar dates (e.g. 2026-02-31), so callers can fall back to "today".
 */
export function parseDateInput(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Reject values that JS silently rolled over (e.g. month 13, day 31 of Feb).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function startOfLocalDayTimestamp(date = new Date()): number {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}
