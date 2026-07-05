import { describe, expect, it } from 'vitest';

import {
  ItemInvariantError,
  ItemPhotoInvariantError,
  assertCreateItemInput,
  assertUrgency,
  clampCoverIndex,
  coerceStatus,
  coerceUrgency,
  coverIndexAfterRemove,
  isItemStatus,
  isUrgencyLevel,
  mapIndexAfterMove,
  moveArrayItem,
  normalizeBlockers,
  normalizeName,
  normalizeOptionalText,
} from './itemRepositoryRules';

describe('urgency rules', () => {
  it('accepts only integer levels 0-3', () => {
    expect([0, 1, 2, 3].every(isUrgencyLevel)).toBe(true);
    expect(isUrgencyLevel(-1)).toBe(false);
    expect(isUrgencyLevel(4)).toBe(false);
    expect(isUrgencyLevel(1.5)).toBe(false);
    expect(isUrgencyLevel('1')).toBe(false);
  });

  it('assertUrgency throws on invalid levels', () => {
    expect(assertUrgency(2)).toBe(2);
    expect(() => assertUrgency(9)).toThrow(ItemInvariantError);
    expect(() => assertUrgency(-1)).toThrow(ItemInvariantError);
  });

  it('coerceUrgency clamps hydrated values into range with a safe default', () => {
    expect(coerceUrgency(3)).toBe(3);
    expect(coerceUrgency(7)).toBe(3);
    expect(coerceUrgency(-2)).toBe(0);
    expect(coerceUrgency(1.7)).toBe(1);
    expect(coerceUrgency(Number.NaN)).toBe(1);
  });
});

describe('status rules', () => {
  it('recognizes only candidate/discarded and coerces unknown values', () => {
    expect(isItemStatus('candidate')).toBe(true);
    expect(isItemStatus('discarded')).toBe(true);
    expect(isItemStatus('archived')).toBe(false);
    expect(coerceStatus('discarded')).toBe('discarded');
    expect(coerceStatus('bogus')).toBe('candidate');
  });
});

describe('clampCoverIndex', () => {
  it('clamps into [0, photoCount)', () => {
    expect(clampCoverIndex(2, 3)).toBe(2);
    expect(clampCoverIndex(5, 3)).toBe(2);
    expect(clampCoverIndex(-1, 3)).toBe(0);
    expect(clampCoverIndex(1.9, 3)).toBe(1);
  });

  it('returns 0 for empty photo lists and non-finite indexes', () => {
    expect(clampCoverIndex(4, 0)).toBe(0);
    expect(clampCoverIndex(Number.NaN, 3)).toBe(0);
  });
});

describe('normalization', () => {
  it('normalizeName trims and falls back to 無名', () => {
    expect(normalizeName(' マグカップ ')).toBe('マグカップ');
    expect(normalizeName('   ')).toBe('無名');
    expect(normalizeName(undefined)).toBe('無名');
  });

  it('normalizeBlockers trims, strips leading #, and drops empties', () => {
    expect(normalizeBlockers([' 思い出 ', '#高かった', '  ', '#  '])).toEqual(['思い出', '高かった']);
    expect(normalizeBlockers(undefined)).toEqual([]);
  });

  it('normalizeOptionalText converts blank input to null', () => {
    expect(normalizeOptionalText('  memo ')).toBe('memo');
    expect(normalizeOptionalText('   ')).toBeNull();
    expect(normalizeOptionalText(null)).toBeNull();
    expect(normalizeOptionalText(undefined)).toBeNull();
  });
});

describe('assertCreateItemInput', () => {
  it('rejects empty photos and invalid urgency', () => {
    expect(() => assertCreateItemInput({ photos: [], urgency: 1 })).toThrow(ItemPhotoInvariantError);
    expect(() => assertCreateItemInput({ photos: ['a'], urgency: 5 })).toThrow(ItemInvariantError);
    expect(() => assertCreateItemInput({ photos: ['a'], urgency: 0 })).not.toThrow();
  });
});

describe('coverIndexAfterRemove', () => {
  it('keeps the same photo as cover when another photo is removed', () => {
    expect(coverIndexAfterRemove(2, 0, 3)).toBe(1);
    expect(coverIndexAfterRemove(0, 2, 3)).toBe(0);
  });

  it('moves to min(deletedIndex, remaining - 1) when the cover is removed', () => {
    expect(coverIndexAfterRemove(1, 1, 3)).toBe(1);
    expect(coverIndexAfterRemove(2, 2, 2)).toBe(1);
    expect(coverIndexAfterRemove(0, 0, 1)).toBe(0);
  });

  it('never returns an out-of-range index', () => {
    expect(coverIndexAfterRemove(9, 0, 2)).toBe(1);
    expect(coverIndexAfterRemove(0, 0, 0)).toBe(0);
  });
});

describe('mapIndexAfterMove / moveArrayItem', () => {
  it('tracks the moved element itself', () => {
    expect(mapIndexAfterMove(0, 0, 2)).toBe(2);
    expect(mapIndexAfterMove(2, 2, 0)).toBe(0);
  });

  it('shifts elements between from and to', () => {
    expect(mapIndexAfterMove(1, 0, 2)).toBe(0);
    expect(mapIndexAfterMove(2, 0, 2)).toBe(1);
    expect(mapIndexAfterMove(0, 2, 0)).toBe(1);
    expect(mapIndexAfterMove(1, 2, 0)).toBe(2);
  });

  it('leaves indexes outside the range untouched', () => {
    expect(mapIndexAfterMove(3, 0, 2)).toBe(3);
    expect(mapIndexAfterMove(0, 1, 2)).toBe(0);
  });

  it('moveArrayItem reorders without mutating the source', () => {
    const source = ['a', 'b', 'c'];
    expect(moveArrayItem(source, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveArrayItem(source, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveArrayItem(source, 1, 1)).toEqual(['a', 'b', 'c']);
    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('mapIndexAfterMove agrees with moveArrayItem for every index', () => {
    const source = ['a', 'b', 'c', 'd'];
    for (let from = 0; from < source.length; from += 1) {
      for (let to = 0; to < source.length; to += 1) {
        const moved = moveArrayItem(source, from, to);
        for (let index = 0; index < source.length; index += 1) {
          expect(moved[mapIndexAfterMove(index, from, to)]).toBe(source[index]);
        }
      }
    }
  });
});
