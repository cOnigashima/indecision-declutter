import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import {
  ItemPhotoInvariantError,
  LastPhotoCannotBeRemovedError,
  assertCreateItemInput,
  assertUrgency,
  clampCoverIndex,
  coerceStatus,
  coerceUrgency,
  coverIndexAfterRemove,
  mapIndexAfterMove,
  moveArrayItem,
  normalizeBlockers,
  normalizeName,
  normalizeOptionalText,
} from './itemRepositoryRules';
import { sampleItems } from './sampleData';
import type { Item, ItemStatus, UrgencyLevel } from '../types/item';

const DATABASE_NAME = Platform.OS === 'web' ? ':memory:' : 'indecision-declutter.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

type ItemRow = {
  id: string;
  name: string;
  cover_index: number;
  urgency: number;
  status: ItemStatus;
  blockers_json: string;
  memory_note: string | null;
  price: number | null;
  last_used_at: string | null;
  location: string | null;
  created_at: number;
  updated_at: number;
  released_at: number | null;
};

type PhotoRow = {
  item_id: string;
  uri: string;
};

type ItemPhotoRow = {
  id: string;
  uri: string;
  sort_order: number;
};

export type RemovePhotoResult = {
  removedUri: string;
  coverIndex: number;
  photos: string[];
};

export type ReorderPhotosResult = {
  coverIndex: number;
  photos: string[];
};

type ItemPatch = {
  name?: string;
  urgency?: UrgencyLevel;
  blockers?: string[];
  memoryNote?: string | null;
  price?: number | null;
  lastUsedAt?: string | null;
  location?: string | null;
  coverIndex?: number;
};

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrateDatabase(db);
      if (shouldSeedSampleData()) {
        await seedDatabase(db);
      }
      return db;
    });
  }

  return databasePromise;
}

export async function listItems(status: ItemStatus): Promise<Item[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ItemRow>(
    `SELECT * FROM items
     WHERE status = ?
     ORDER BY COALESCE(released_at, updated_at, created_at) DESC`,
    status
  );

  return hydrateItems(db, rows);
}

export async function getItem(id: string): Promise<Item | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items WHERE id = ? LIMIT 1', id);
  const [item] = await hydrateItems(db, rows);
  return item ?? null;
}

export async function createItemFromPhotos(input: {
  photos: string[];
  urgency: UrgencyLevel;
  name?: string;
  blockers?: string[];
  memoryNote?: string;
}): Promise<string> {
  assertCreateItemInput(input);
  const db = await getDatabase();
  const now = Date.now();
  const id = createId('item');
  const name = normalizeName(input.name);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO items (
        id, name, cover_index, urgency, status, blockers_json, memory_note,
        price, last_used_at, location, created_at, updated_at, released_at
      ) VALUES (?, ?, ?, ?, 'candidate', ?, ?, NULL, NULL, NULL, ?, ?, NULL)`,
      id,
      name,
      0,
      input.urgency,
      JSON.stringify(normalizeBlockers(input.blockers)),
      normalizeOptionalText(input.memoryNote),
      now,
      now
    );

    for (const [index, uri] of input.photos.entries()) {
      await db.runAsync(
        `INSERT INTO item_photos (id, item_id, uri, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        createId('photo'),
        id,
        uri,
        index,
        now
      );
    }
  });

  return id;
}

export async function updateItem(id: string, patch: ItemPatch): Promise<void> {
  const db = await getDatabase();
  const current = await getItem(id);
  if (!current) {
    return;
  }

  const nextName = hasPatch(patch, 'name') ? normalizeName(patch.name) : current.name;
  const nextCoverIndex = clampCoverIndex(
    hasPatch(patch, 'coverIndex') ? patch.coverIndex ?? current.coverIndex : current.coverIndex,
    current.photos.length
  );
  const nextUrgency = hasPatch(patch, 'urgency') ? assertUrgency(patch.urgency ?? current.urgency) : current.urgency;
  const nextBlockers = hasPatch(patch, 'blockers') ? normalizeBlockers(patch.blockers) : current.blockers;
  const nextMemoryNote = hasPatch(patch, 'memoryNote') ? normalizeOptionalText(patch.memoryNote) : current.memoryNote ?? null;
  const nextPrice = hasPatch(patch, 'price') ? patch.price ?? null : current.price ?? null;
  const nextLastUsedAt = hasPatch(patch, 'lastUsedAt') ? normalizeOptionalText(patch.lastUsedAt) : current.lastUsedAt ?? null;
  const nextLocation = hasPatch(patch, 'location') ? normalizeOptionalText(patch.location) : current.location ?? null;

  await db.runAsync(
    `UPDATE items
     SET name = ?,
         cover_index = ?,
         urgency = ?,
         blockers_json = ?,
         memory_note = ?,
         price = ?,
         last_used_at = ?,
         location = ?,
         updated_at = ?
     WHERE id = ?`,
    nextName,
    nextCoverIndex,
    nextUrgency,
    JSON.stringify(nextBlockers),
    nextMemoryNote,
    nextPrice,
    nextLastUsedAt,
    nextLocation,
    Date.now(),
    id
  );
}

export async function addPhotoToItem(itemId: string, uri: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  // Callers delete the photo file when this throws, so the insert and the
  // item touch must land atomically or not at all.
  await db.withTransactionAsync(async () => {
    const orderRows = await db.getAllAsync<{ next_order: number | null }>(
      'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_order FROM item_photos WHERE item_id = ?',
      itemId
    );
    const nextOrder = orderRows[0]?.next_order ?? 0;

    await db.runAsync(
      `INSERT INTO item_photos (id, item_id, uri, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      createId('photo'),
      itemId,
      uri,
      nextOrder,
      now
    );

    await db.runAsync('UPDATE items SET updated_at = ? WHERE id = ?', now, itemId);
  });
}

export async function removePhotoFromItem(itemId: string, photoIndex: number): Promise<RemovePhotoResult> {
  const db = await getDatabase();
  let result: RemovePhotoResult | null = null;

  await db.withTransactionAsync(async () => {
    const photoRows = await readItemPhotoRows(db, itemId);
    if (photoRows.length === 0) {
      throw new ItemPhotoInvariantError();
    }
    if (photoRows.length === 1) {
      throw new LastPhotoCannotBeRemovedError();
    }

    const coverRows = await db.getAllAsync<{ cover_index: number }>(
      'SELECT cover_index FROM items WHERE id = ? LIMIT 1',
      itemId
    );
    if (coverRows.length === 0) {
      throw new ItemPhotoInvariantError('記録が見つかりません。');
    }

    const currentCover = clampCoverIndex(coverRows[0].cover_index, photoRows.length);
    const removeIndex = clampCoverIndex(photoIndex, photoRows.length);
    const removed = photoRows[removeIndex];

    await db.runAsync('DELETE FROM item_photos WHERE id = ?', removed.id);

    const remaining = photoRows.filter((_, index) => index !== removeIndex);
    await renumberPhotoRows(db, remaining);

    const nextCover = coverIndexAfterRemove(currentCover, removeIndex, remaining.length);
    await db.runAsync('UPDATE items SET cover_index = ?, updated_at = ? WHERE id = ?', nextCover, Date.now(), itemId);

    result = {
      removedUri: removed.uri,
      coverIndex: nextCover,
      photos: remaining.map((row) => row.uri),
    };
  });

  if (!result) {
    throw new ItemPhotoInvariantError('写真を削除できませんでした。');
  }
  return result;
}

export async function setCoverPhoto(itemId: string, photoIndex: number): Promise<number> {
  const db = await getDatabase();
  const countRows = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM item_photos WHERE item_id = ?',
    itemId
  );
  const photoCount = countRows[0]?.count ?? 0;
  if (photoCount === 0) {
    throw new ItemPhotoInvariantError();
  }

  const nextCover = clampCoverIndex(photoIndex, photoCount);
  await db.runAsync('UPDATE items SET cover_index = ?, updated_at = ? WHERE id = ?', nextCover, Date.now(), itemId);
  return nextCover;
}

export async function reorderItemPhotos(itemId: string, fromIndex: number, toIndex: number): Promise<ReorderPhotosResult> {
  const db = await getDatabase();
  let result: ReorderPhotosResult | null = null;

  await db.withTransactionAsync(async () => {
    const photoRows = await readItemPhotoRows(db, itemId);
    if (photoRows.length === 0) {
      throw new ItemPhotoInvariantError();
    }

    const coverRows = await db.getAllAsync<{ cover_index: number }>(
      'SELECT cover_index FROM items WHERE id = ? LIMIT 1',
      itemId
    );
    if (coverRows.length === 0) {
      throw new ItemPhotoInvariantError('記録が見つかりません。');
    }

    const currentCover = clampCoverIndex(coverRows[0].cover_index, photoRows.length);
    const from = clampCoverIndex(fromIndex, photoRows.length);
    const to = clampCoverIndex(toIndex, photoRows.length);

    const reordered = moveArrayItem(photoRows, from, to);
    await renumberPhotoRows(db, reordered);

    const nextCover = clampCoverIndex(mapIndexAfterMove(currentCover, from, to), reordered.length);
    await db.runAsync('UPDATE items SET cover_index = ?, updated_at = ? WHERE id = ?', nextCover, Date.now(), itemId);

    result = {
      coverIndex: nextCover,
      photos: reordered.map((row) => row.uri),
    };
  });

  if (!result) {
    throw new ItemPhotoInvariantError('写真を並べ替えられませんでした。');
  }
  return result;
}

async function readItemPhotoRows(db: SQLiteDatabase, itemId: string): Promise<ItemPhotoRow[]> {
  return db.getAllAsync<ItemPhotoRow>(
    'SELECT id, uri, sort_order FROM item_photos WHERE item_id = ? ORDER BY sort_order ASC',
    itemId
  );
}

async function renumberPhotoRows(db: SQLiteDatabase, rows: ItemPhotoRow[]): Promise<void> {
  for (const [index, row] of rows.entries()) {
    if (row.sort_order !== index) {
      await db.runAsync('UPDATE item_photos SET sort_order = ? WHERE id = ?', index, row.id);
    }
  }
}

export async function releaseItem(itemId: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE items
     SET status = 'discarded',
         released_at = ?,
         updated_at = ?
     WHERE id = ?`,
    now,
    now,
    itemId
  );
}

export async function restoreItem(itemId: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE items
     SET status = 'candidate',
         released_at = NULL,
         updated_at = ?
     WHERE id = ?`,
    now,
    itemId
  );
}

export async function deleteItem(itemId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM items WHERE id = ?', itemId);
}

async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      cover_index INTEGER NOT NULL DEFAULT 0,
      urgency INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'candidate',
      blockers_json TEXT NOT NULL DEFAULT '[]',
      memory_note TEXT,
      price INTEGER,
      last_used_at TEXT,
      location TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      released_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS item_photos (
      id TEXT PRIMARY KEY NOT NULL,
      item_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_items_status_updated_at
      ON items(status, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_item_photos_item_order
      ON item_photos(item_id, sort_order ASC);
  `);
}

type RuntimeEnv = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function shouldSeedSampleData(): boolean {
  const env = (globalThis as RuntimeEnv).process?.env;
  return env?.EXPO_PUBLIC_SEED_SAMPLE_DATA === '1';
}

async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const countRows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) AS count FROM items');
  if ((countRows[0]?.count ?? 0) > 0) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const item of Object.values(sampleItems)) {
      await db.runAsync(
        `INSERT INTO items (
          id, name, cover_index, urgency, status, blockers_json, memory_note,
          price, last_used_at, location, created_at, updated_at, released_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.name,
        item.coverIndex,
        item.urgency,
        item.status,
        JSON.stringify(item.blockers),
        item.memoryNote ?? null,
        item.price ?? null,
        item.lastUsedAt ?? null,
        item.location ?? null,
        item.createdAt,
        item.updatedAt,
        item.releasedAt ?? null
      );

      for (const [index, uri] of item.photos.entries()) {
        await db.runAsync(
          `INSERT INTO item_photos (id, item_id, uri, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          createId('seed-photo'),
          item.id,
          uri,
          index,
          item.createdAt
        );
      }
    }
  });
}

async function hydrateItems(db: SQLiteDatabase, rows: ItemRow[]): Promise<Item[]> {
  if (rows.length === 0) {
    return [];
  }

  const placeholders = rows.map(() => '?').join(',');
  const photoRows = await db.getAllAsync<PhotoRow>(
    `SELECT item_id, uri
     FROM item_photos
     WHERE item_id IN (${placeholders})
     ORDER BY item_id ASC, sort_order ASC`,
    rows.map((row) => row.id)
  );
  const photosByItem = new Map<string, string[]>();

  for (const photo of photoRows) {
    const photos = photosByItem.get(photo.item_id) ?? [];
    photos.push(photo.uri);
    photosByItem.set(photo.item_id, photos);
  }

  return rows.map((row) => rowToItem(row, photosByItem.get(row.id) ?? []));
}

function rowToItem(row: ItemRow, photos: string[]): Item {
  return {
    id: row.id,
    name: row.name,
    photos,
    coverIndex: clampCoverIndex(row.cover_index, photos.length),
    urgency: coerceUrgency(row.urgency),
    status: coerceStatus(row.status),
    blockers: parseBlockers(row.blockers_json),
    memoryNote: row.memory_note ?? undefined,
    price: row.price ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    location: row.location ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    releasedAt: row.released_at ?? undefined,
  };
}

function parseBlockers(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function hasPatch<Key extends keyof ItemPatch>(patch: ItemPatch, key: Key): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key);
}
