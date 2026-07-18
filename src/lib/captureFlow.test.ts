import { describe, expect, it } from 'vitest';

import { canRelease } from './captureFlow';

describe('canRelease', () => {
  it('withholds the release action until a photo exists', () => {
    expect(canRelease([])).toBe(false);
  });

  it('allows release once at least one photo is captured', () => {
    expect(canRelease(['photo-1'])).toBe(true);
    expect(canRelease(['photo-1', 'photo-2'])).toBe(true);
  });
});
