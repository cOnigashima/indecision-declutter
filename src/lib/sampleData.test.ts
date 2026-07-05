import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sampleItems', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('keeps seed fixtures internally consistent for first-run app states', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T12:00:00+09:00'));
    vi.resetModules();
    const { sampleItems } = await import('./sampleData');
    const items = Object.values(sampleItems);

    expect(items.some((item) => item.status === 'candidate')).toBe(true);
    expect(items.some((item) => item.status === 'discarded')).toBe(true);

    for (const [key, item] of Object.entries(sampleItems)) {
      expect(item.id).toBe(key);
      expect(item.name.trim()).toBeTruthy();
      expect(item.photos.length).toBeGreaterThan(0);
      expect(item.coverIndex).toBeGreaterThanOrEqual(0);
      expect(item.coverIndex).toBeLessThan(item.photos.length);
      expect(item.createdAt).toBeLessThanOrEqual(item.updatedAt);

      if (item.status === 'discarded') {
        expect(item.releasedAt).toBeDefined();
        expect(item.releasedAt).toBeGreaterThanOrEqual(item.createdAt);
      } else {
        expect(item.releasedAt).toBeUndefined();
      }
    }
  });
});
