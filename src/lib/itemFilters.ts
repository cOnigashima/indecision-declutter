import type { Item, UrgencyLevel } from '../types/item';

export type CandidateFilters = {
  urgency?: UrgencyLevel;
  blocker?: string;
};

export function filterCandidateItems(items: Item[], filters: CandidateFilters): Item[] {
  return items.filter((item) => {
    if (filters.urgency !== undefined && item.urgency !== filters.urgency) {
      return false;
    }

    if (filters.blocker && !item.blockers.includes(filters.blocker)) {
      return false;
    }

    return true;
  });
}

export function listCandidateBlockers(items: Item[]): string[] {
  const blockers = new Set<string>();

  for (const item of items) {
    for (const blocker of item.blockers) {
      const normalized = blocker.trim();
      if (normalized) {
        blockers.add(normalized);
      }
    }
  }

  return Array.from(blockers);
}
