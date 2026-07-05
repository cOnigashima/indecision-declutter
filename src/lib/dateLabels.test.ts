import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  daysBetweenLabel,
  formatDateInput,
  monthDayLabel,
  relativeDateLabel,
  startOfLocalDayTimestamp,
} from './dateLabels';

afterEach(() => {
  vi.useRealTimers();
});

describe('dateLabels', () => {
  it('formats relative dates in Japanese buckets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T12:00:00+09:00'));

    expect(relativeDateLabel(new Date('2026-07-05T00:00:00+09:00').getTime())).toBe('今日');
    expect(relativeDateLabel(new Date('2026-07-04T12:00:00+09:00').getTime())).toBe('1日前');
    expect(relativeDateLabel(new Date('2026-06-29T12:00:00+09:00').getTime())).toBe('6日前');
    expect(relativeDateLabel(new Date('2026-06-28T12:00:00+09:00').getTime())).toBe('1週間前');
    expect(relativeDateLabel(new Date('2026-06-21T12:00:00+09:00').getTime())).toBe('2週間前');
    expect(relativeDateLabel(new Date('2026-06-05T12:00:00+09:00').getTime())).toBe('4週間前');
    expect(relativeDateLabel(new Date('2026-05-31T12:00:00+09:00').getTime())).toBe('1ヶ月前');
  });

  it('formats month-day and duration labels', () => {
    const createdAt = new Date('2026-03-12T10:00:00+09:00').getTime();
    const releasedAt = new Date('2026-03-28T10:00:00+09:00').getTime();

    expect(monthDayLabel(createdAt)).toBe('3月12日');
    expect(daysBetweenLabel(createdAt, releasedAt)).toBe('16日間');
  });

  it('uses placeholders and clamps future timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T12:00:00+09:00'));

    expect(relativeDateLabel()).toBe('-');
    expect(monthDayLabel()).toBe('-');
    expect(relativeDateLabel(new Date('2026-07-06T12:00:00+09:00').getTime())).toBe('今日');
    expect(daysBetweenLabel(new Date('2026-07-06T12:00:00+09:00').getTime())).toBe('0日間');
  });

  it('formats dates for text inputs with zero-padded month and day', () => {
    expect(formatDateInput(new Date('2026-03-05T10:00:00+09:00'))).toBe('2026-03-05');
    expect(formatDateInput(new Date('2026-11-15T10:00:00+09:00'))).toBe('2026-11-15');
  });

  it('returns the local-day start used by today counts', () => {
    expect(startOfLocalDayTimestamp(new Date('2026-07-05T14:35:20+09:00'))).toBe(
      new Date('2026-07-05T00:00:00+09:00').getTime()
    );
  });
});
