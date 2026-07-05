import Dexie, { type EntityTable } from 'dexie';

export type UrgencyLevel = 0 | 1 | 2 | 3;
export type ItemStatus = 'want' | 'hold' | 'discarded';

export interface Item {
    id: string; // UUID
    imageData: string; // Base64
    urgency: UrgencyLevel;
    status: ItemStatus;
    blockers: string[]; // Fixed tags
    memoryNote?: string;
    createdAt: number;
    updatedAt: number;
}

const db = new Dexie('DeclutterDB') as Dexie & {
    items: EntityTable<Item, 'id'>;
};

// Schema definition
db.version(1).stores({
    items: 'id, status, urgency, createdAt, updatedAt' // Indexed fields
});

export { db };
