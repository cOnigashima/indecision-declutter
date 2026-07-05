import type { ItemStatus, UrgencyLevel } from '../types/item';

export class ItemInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ItemInvariantError';
  }
}

export class ItemPhotoInvariantError extends ItemInvariantError {
  constructor(message = '写真の記録が壊れています。') {
    super(message);
    this.name = 'ItemPhotoInvariantError';
  }
}

export class LastPhotoCannotBeRemovedError extends ItemInvariantError {
  constructor() {
    super('写真は1枚以上必要です。');
    this.name = 'LastPhotoCannotBeRemovedError';
  }
}

const URGENCY_LEVELS: readonly number[] = [0, 1, 2, 3];
const DEFAULT_URGENCY: UrgencyLevel = 1;

export function isUrgencyLevel(value: unknown): value is UrgencyLevel {
  return typeof value === 'number' && URGENCY_LEVELS.includes(value);
}

export function assertUrgency(value: number): UrgencyLevel {
  if (!isUrgencyLevel(value)) {
    throw new ItemInvariantError(`urgency は 0〜3 で指定してください: ${value}`);
  }
  return value;
}

export function coerceUrgency(value: number): UrgencyLevel {
  if (isUrgencyLevel(value)) {
    return value;
  }
  if (!Number.isFinite(value)) {
    return DEFAULT_URGENCY;
  }
  const clamped = Math.max(0, Math.min(3, Math.trunc(value)));
  return isUrgencyLevel(clamped) ? clamped : DEFAULT_URGENCY;
}

export function isItemStatus(value: unknown): value is ItemStatus {
  return value === 'candidate' || value === 'discarded';
}

export function coerceStatus(value: string): ItemStatus {
  return isItemStatus(value) ? value : 'candidate';
}

export function clampCoverIndex(index: number, photoCount: number): number {
  if (photoCount <= 0 || !Number.isFinite(index)) {
    return 0;
  }
  return Math.max(0, Math.min(Math.trunc(index), photoCount - 1));
}

export function normalizeName(name: string | undefined): string {
  return name?.trim() || '無名';
}

export function normalizeBlockers(blockers: string[] | undefined): string[] {
  return (blockers ?? [])
    .map((blocker) => blocker.trim().replace(/^#/, '').trim())
    .filter(Boolean);
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function assertCreateItemInput(input: { photos: string[]; urgency: number }): void {
  if (input.photos.length === 0) {
    throw new ItemPhotoInvariantError('写真は1枚以上必要です。');
  }
  assertUrgency(input.urgency);
}

/**
 * Cover index after removing the photo at removedIndex.
 * When the cover itself is removed, the next cover is
 * min(removedIndex, remainingCount - 1) per the hardening spec.
 */
export function coverIndexAfterRemove(coverIndex: number, removedIndex: number, remainingCount: number): number {
  if (remainingCount <= 0) {
    return 0;
  }
  if (coverIndex === removedIndex) {
    return clampCoverIndex(Math.min(removedIndex, remainingCount - 1), remainingCount);
  }
  const shifted = coverIndex > removedIndex ? coverIndex - 1 : coverIndex;
  return clampCoverIndex(shifted, remainingCount);
}

/** Index of the same element after moving one element from `from` to `to`. */
export function mapIndexAfterMove(index: number, from: number, to: number): number {
  if (index === from) {
    return to;
  }
  if (from < index && index <= to) {
    return index - 1;
  }
  if (to <= index && index < from) {
    return index + 1;
  }
  return index;
}

export function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
