import { describe, expect, it } from 'vitest';

import { clampPhotoIndex, movePhotoToFront } from './photoSelection';

describe('clampPhotoIndex', () => {
  it('keeps a valid index unchanged', () => {
    expect(clampPhotoIndex(1, 3)).toBe(1);
  });

  it('clamps below-range, above-range, and empty photo lists', () => {
    expect(clampPhotoIndex(-1, 3)).toBe(0);
    expect(clampPhotoIndex(5, 3)).toBe(2);
    expect(clampPhotoIndex(2, 0)).toBe(0);
  });

  it('normalizes non-integer and non-finite values to a renderable index', () => {
    expect(clampPhotoIndex(1.9, 3)).toBe(1);
    expect(clampPhotoIndex(Number.NaN, 3)).toBe(0);
    expect(clampPhotoIndex(Number.POSITIVE_INFINITY, 3)).toBe(0);
  });
});

describe('movePhotoToFront', () => {
  it('moves the selected cover photo to the front before creating an item', () => {
    expect(movePhotoToFront(['first', 'cover', 'last'], 1)).toEqual(['cover', 'first', 'last']);
    expect(movePhotoToFront(['first', 'middle', 'cover'], 2)).toEqual(['cover', 'first', 'middle']);
  });

  it('does not reorder when the first photo is already selected or the list is empty', () => {
    const photos = ['cover', 'second'];

    expect(movePhotoToFront(photos, 0)).toBe(photos);
    expect(movePhotoToFront([], 1)).toEqual([]);
  });

  it('does not reorder when the selected index is out of range', () => {
    const photos = ['cover', 'second'];

    expect(movePhotoToFront(photos, -4)).toBe(photos);
    expect(movePhotoToFront(photos, 99)).toBe(photos);
    expect(movePhotoToFront(photos, Number.NaN)).toBe(photos);
  });
});
