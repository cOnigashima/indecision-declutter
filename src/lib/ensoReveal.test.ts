import { describe, expect, it } from 'vitest';

import {
  SETTLE_GRACE_MS,
  revealFrameIndex,
  settleDelayMs,
} from './ensoReveal';

describe('enso reveal frame index', () => {
  it('maps time linearly onto frames with clamped endpoints', () => {
    expect(revealFrameIndex(0, 420, 24)).toBe(0);
    expect(revealFrameIndex(-10, 420, 24)).toBe(0);
    expect(revealFrameIndex(210, 420, 24)).toBe(12);
    expect(revealFrameIndex(419, 420, 24)).toBe(23);
    expect(revealFrameIndex(420, 420, 24)).toBe(23);
    expect(revealFrameIndex(1000, 420, 24)).toBe(23);
  });

  it('is monotonically non-decreasing over time', () => {
    let prev = 0;
    for (let t = 0; t <= 420; t += 10) {
      const index = revealFrameIndex(t, 420, 24);
      expect(index).toBeGreaterThanOrEqual(prev);
      prev = index;
    }
  });

  it('handles degenerate inputs', () => {
    expect(revealFrameIndex(100, 0, 24)).toBe(23);
    expect(revealFrameIndex(100, 420, 1)).toBe(0);
    expect(revealFrameIndex(100, 420, 0)).toBe(0);
  });
});

describe('enso reveal settle', () => {
  it('schedules the settle guarantee after the animation plus a grace period', () => {
    expect(settleDelayMs(420)).toBe(420 + SETTLE_GRACE_MS);
    expect(settleDelayMs(-100)).toBe(SETTLE_GRACE_MS);
  });
});
