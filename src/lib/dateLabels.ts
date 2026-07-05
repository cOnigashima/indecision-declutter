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

export function startOfLocalDayTimestamp(date = new Date()): number {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}
