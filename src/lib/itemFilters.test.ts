import { describe, expect, it } from 'vitest';

import { filterCandidateItems, listCandidateBlockers } from './itemFilters';
import type { Item } from '../types/item';

const baseItem = {
  photos: [],
  coverIndex: 0,
  status: 'candidate',
  memoryNote: '',
  createdAt: 1,
  updatedAt: 1,
} satisfies Partial<Item>;

const items: Item[] = [
  { ...baseItem, id: 'a', name: 'A', urgency: 1, blockers: ['思い出'] } as Item,
  { ...baseItem, id: 'b', name: 'B', urgency: 3, blockers: ['いつか使う'] } as Item,
  { ...baseItem, id: 'c', name: 'C', urgency: 1, blockers: ['思い出', '高かった'] } as Item,
];

describe('filterCandidateItems', () => {
  it('returns all items in original order when no filters are active', () => {
    expect(filterCandidateItems(items, {}).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('filters by urgency', () => {
    expect(filterCandidateItems(items, { urgency: 1 }).map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('filters by blocker tag', () => {
    expect(filterCandidateItems(items, { blocker: '高かった' }).map((item) => item.id)).toEqual(['c']);
  });

  it('combines urgency and blocker tag filters', () => {
    expect(filterCandidateItems(items, { urgency: 3, blocker: '思い出' })).toEqual([]);
  });
});

describe('listCandidateBlockers', () => {
  it('returns unique blocker tags in encounter order', () => {
    expect(listCandidateBlockers(items)).toEqual(['思い出', 'いつか使う', '高かった']);
  });

  it('trims blocker tags and skips blank values before deduping', () => {
    const messyItems = [
      { ...baseItem, id: 'a', name: 'A', urgency: 1, blockers: [' 思い出 ', '', '   '] } as Item,
      { ...baseItem, id: 'b', name: 'B', urgency: 1, blockers: ['思い出', '高かった'] } as Item,
    ];

    expect(listCandidateBlockers(messyItems)).toEqual(['思い出', '高かった']);
  });
});
