export type UrgencyLevel = 0 | 1 | 2 | 3;

export type ItemStatus = 'candidate' | 'discarded';

export interface Item {
  id: string;
  name: string;
  photos: string[];
  coverIndex: number;
  urgency: UrgencyLevel;
  status: ItemStatus;
  blockers: string[];
  memoryNote?: string;
  price?: number;
  lastUsedAt?: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
  releasedAt?: number;
}
