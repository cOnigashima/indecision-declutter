import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FakeItemRow = {
  id: string;
  name: string;
  cover_index: number;
  urgency: number;
  status: 'candidate' | 'discarded';
  blockers_json: string;
  memory_note: string | null;
  price: number | null;
  last_used_at: string | null;
  location: string | null;
  created_at: number;
  updated_at: number;
  released_at: number | null;
};

type FakePhotoRow = {
  id: string;
  item_id: string;
  uri: string;
  sort_order: number;
  created_at: number;
};

class FakeSqliteDatabase {
  readonly itemRows = new Map<string, FakeItemRow>();
  readonly photoRows: FakePhotoRow[] = [];
  readonly execAsync = vi.fn(async (_sql: string) => undefined);
  readonly runAsync = vi.fn(async (sql: string, ...params: unknown[]) => {
    this.mutate(sql, params);
  });
  readonly withTransactionAsync = vi.fn(async (callback: () => Promise<void>) => {
    await callback();
  });

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    return this.select(sql, params) as T[];
  }

  seedItem(row: Partial<FakeItemRow> & Pick<FakeItemRow, 'id' | 'name'>, photos: string[] = []): void {
    this.itemRows.set(row.id, {
      cover_index: 0,
      urgency: 1,
      status: 'candidate',
      blockers_json: '[]',
      memory_note: null,
      price: null,
      last_used_at: null,
      location: null,
      created_at: 1,
      updated_at: 1,
      released_at: null,
      ...row,
    });

    photos.forEach((uri, index) => {
      this.photoRows.push({
        id: `seed-photo-${row.id}-${index}`,
        item_id: row.id,
        uri,
        sort_order: index,
        created_at: row.created_at ?? 1,
      });
    });
  }

  private select(sql: string, params: unknown[]): unknown[] {
    if (sql.includes('SELECT COUNT(*) AS count FROM items')) {
      return [{ count: this.itemRows.size }];
    }

    if (sql.includes('SELECT * FROM items WHERE id = ? LIMIT 1')) {
      const row = this.itemRows.get(String(params[0]));
      return row ? [row] : [];
    }

    if (sql.includes('SELECT * FROM items') && sql.includes('WHERE status = ?')) {
      const status = params[0];
      return Array.from(this.itemRows.values())
        .filter((row) => row.status === status)
        .sort((a, b) => sortTimestamp(b) - sortTimestamp(a));
    }

    if (sql.includes('SELECT item_id, uri')) {
      const ids = Array.isArray(params[0]) ? params[0].map(String) : params.map(String);
      return this.photoRows
        .filter((row) => ids.includes(row.item_id))
        .sort((a, b) => a.item_id.localeCompare(b.item_id) || a.sort_order - b.sort_order)
        .map(({ item_id, uri }) => ({ item_id, uri }));
    }

    if (sql.includes('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_order')) {
      const itemId = String(params[0]);
      const orders = this.photoRows.filter((row) => row.item_id === itemId).map((row) => row.sort_order);
      const nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 0;
      return [{ next_order: nextOrder }];
    }

    if (sql.includes('SELECT id, uri, sort_order FROM item_photos')) {
      const itemId = String(params[0]);
      return this.photoRows
        .filter((row) => row.item_id === itemId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ id, uri, sort_order }) => ({ id, uri, sort_order }));
    }

    if (sql.includes('SELECT cover_index FROM items WHERE id = ? LIMIT 1')) {
      const row = this.itemRows.get(String(params[0]));
      return row ? [{ cover_index: row.cover_index }] : [];
    }

    if (sql.includes('SELECT COUNT(*) AS count FROM item_photos')) {
      const itemId = String(params[0]);
      return [{ count: this.photoRows.filter((row) => row.item_id === itemId).length }];
    }

    throw new Error(`Unhandled fake SELECT: ${sql}`);
  }

  private mutate(sql: string, params: unknown[]): void {
    if (sql.includes('INSERT INTO items')) {
      this.insertItem(params);
      return;
    }

    if (sql.includes('INSERT INTO item_photos')) {
      const [id, itemId, uri, sortOrder, createdAt] = params;
      this.photoRows.push({
        id: String(id),
        item_id: String(itemId),
        uri: String(uri),
        sort_order: Number(sortOrder),
        created_at: Number(createdAt),
      });
      return;
    }

    if (sql.includes('SET name = ?')) {
      const [name, coverIndex, urgency, blockersJson, memoryNote, price, lastUsedAt, location, updatedAt, id] = params;
      const row = this.itemRows.get(String(id));
      if (row) {
        Object.assign(row, {
          name: String(name),
          cover_index: Number(coverIndex),
          urgency: Number(urgency),
          blockers_json: String(blockersJson),
          memory_note: nullableString(memoryNote),
          price: nullableNumber(price),
          last_used_at: nullableString(lastUsedAt),
          location: nullableString(location),
          updated_at: Number(updatedAt),
        });
      }
      return;
    }

    if (sql.includes("SET status = 'discarded'")) {
      const [releasedAt, updatedAt, id] = params;
      const row = this.itemRows.get(String(id));
      if (row) {
        row.status = 'discarded';
        row.released_at = Number(releasedAt);
        row.updated_at = Number(updatedAt);
      }
      return;
    }

    if (sql.includes("SET status = 'candidate'")) {
      const [updatedAt, id] = params;
      const row = this.itemRows.get(String(id));
      if (row) {
        row.status = 'candidate';
        row.released_at = null;
        row.updated_at = Number(updatedAt);
      }
      return;
    }

    if (sql.includes('UPDATE items SET updated_at = ? WHERE id = ?')) {
      const [updatedAt, id] = params;
      const row = this.itemRows.get(String(id));
      if (row) {
        row.updated_at = Number(updatedAt);
      }
      return;
    }

    if (sql.includes('UPDATE items SET cover_index = ?, updated_at = ? WHERE id = ?')) {
      const [coverIndex, updatedAt, id] = params;
      const row = this.itemRows.get(String(id));
      if (row) {
        row.cover_index = Number(coverIndex);
        row.updated_at = Number(updatedAt);
      }
      return;
    }

    if (sql.includes('UPDATE item_photos SET sort_order = ? WHERE id = ?')) {
      const [sortOrder, id] = params;
      const row = this.photoRows.find((photo) => photo.id === String(id));
      if (row) {
        row.sort_order = Number(sortOrder);
      }
      return;
    }

    if (sql.includes('DELETE FROM item_photos WHERE id = ?')) {
      const id = String(params[0]);
      const index = this.photoRows.findIndex((photo) => photo.id === id);
      if (index >= 0) {
        this.photoRows.splice(index, 1);
      }
      return;
    }

    if (sql.includes('DELETE FROM items WHERE id = ?')) {
      const id = String(params[0]);
      this.itemRows.delete(id);
      for (let index = this.photoRows.length - 1; index >= 0; index -= 1) {
        if (this.photoRows[index].item_id === id) {
          this.photoRows.splice(index, 1);
        }
      }
      return;
    }

    throw new Error(`Unhandled fake mutation: ${sql}`);
  }

  private insertItem(params: unknown[]): void {
    if (params.length === 8) {
      const [id, name, coverIndex, urgency, blockersJson, memoryNote, createdAt, updatedAt] = params;
      this.itemRows.set(String(id), {
        id: String(id),
        name: String(name),
        cover_index: Number(coverIndex),
        urgency: Number(urgency),
        status: 'candidate',
        blockers_json: String(blockersJson),
        memory_note: nullableString(memoryNote),
        price: null,
        last_used_at: null,
        location: null,
        created_at: Number(createdAt),
        updated_at: Number(updatedAt),
        released_at: null,
      });
      return;
    }

    const [id, name, coverIndex, urgency, status, blockersJson, memoryNote, price, lastUsedAt, location, createdAt, updatedAt, releasedAt] =
      params;
    this.itemRows.set(String(id), {
      id: String(id),
      name: String(name),
      cover_index: Number(coverIndex),
      urgency: Number(urgency),
      status: status as FakeItemRow['status'],
      blockers_json: String(blockersJson),
      memory_note: nullableString(memoryNote),
      price: nullableNumber(price),
      last_used_at: nullableString(lastUsedAt),
      location: nullableString(location),
      created_at: Number(createdAt),
      updated_at: Number(updatedAt),
      released_at: nullableNumber(releasedAt),
    });
  }
}

function sortTimestamp(row: FakeItemRow): number {
  return row.released_at ?? row.updated_at ?? row.created_at;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

async function loadDbModule(fakeDb = new FakeSqliteDatabase()) {
  vi.resetModules();
  const openDatabaseAsync = vi.fn(async (_name: string) => fakeDb);

  vi.doMock('expo-sqlite', () => ({ openDatabaseAsync }));
  vi.doMock('react-native', () => ({ Platform: { OS: 'web' } }));

  const dbModule = await import('./db');
  return { dbModule, fakeDb, openDatabaseAsync };
}

describe('db', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SEED_SAMPLE_DATA;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('opens and migrates the in-memory web database once', async () => {
    const { dbModule, fakeDb, openDatabaseAsync } = await loadDbModule();

    await expect(dbModule.getDatabase()).resolves.toBe(fakeDb);
    await expect(dbModule.getDatabase()).resolves.toBe(fakeDb);

    expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(openDatabaseAsync).toHaveBeenCalledWith(':memory:');
    expect(fakeDb.execAsync).toHaveBeenCalledTimes(1);
    expect(fakeDb.execAsync.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS items');
  });

  it('hydrates listed items with ordered photos and resilient blocker parsing', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem(
      {
        id: 'older',
        name: 'Older',
        blockers_json: '["思い出",42,"高かった"]',
        updated_at: 100,
      },
      ['older-cover', 'older-second']
    );
    fakeDb.seedItem({
      id: 'newer',
      name: 'Newer',
      blockers_json: 'not-json',
      updated_at: 300,
    });
    fakeDb.seedItem({
      id: 'discarded',
      name: 'Discarded',
      status: 'discarded',
      blockers_json: '["手放し済み"]',
      released_at: 500,
      updated_at: 500,
    });

    const items = await dbModule.listItems('candidate');

    expect(items.map((item) => item.id)).toEqual(['newer', 'older']);
    expect(items[0].blockers).toEqual([]);
    expect(items[1]).toMatchObject({
      blockers: ['思い出', '高かった'],
      photos: ['older-cover', 'older-second'],
    });
  });

  it('returns a single hydrated item or null for missing ids', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem(
      {
        id: 'item-a',
        name: 'Item A',
        blockers_json: '["いつか使う"]',
        memory_note: 'memo',
        price: 1200,
        last_used_at: '2026-06-01',
        location: '棚',
      },
      ['photo-a']
    );

    await expect(dbModule.getItem('item-a')).resolves.toMatchObject({
      id: 'item-a',
      blockers: ['いつか使う'],
      lastUsedAt: '2026-06-01',
      location: '棚',
      memoryNote: 'memo',
      photos: ['photo-a'],
      price: 1200,
    });
    await expect(dbModule.getItem('missing')).resolves.toBeNull();
  });

  it('creates a candidate item with normalized default fields and photo order', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T00:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const { dbModule, fakeDb } = await loadDbModule();

    const id = await dbModule.createItemFromPhotos({
      blockers: ['思い出'],
      memoryNote: '残す理由',
      name: '   ',
      photos: ['photo-1', 'photo-2'],
      urgency: 2,
    });

    expect(id).toMatch(/^item-/);
    expect(fakeDb.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(fakeDb.itemRows.get(id)).toMatchObject({
      blockers_json: '["思い出"]',
      cover_index: 0,
      memory_note: '残す理由',
      name: '無名',
      status: 'candidate',
      urgency: 2,
    });
    expect(fakeDb.photoRows.filter((row) => row.item_id === id).map((row) => [row.uri, row.sort_order])).toEqual([
      ['photo-1', 0],
      ['photo-2', 1],
    ]);
  });

  it('updates only supplied item fields and can explicitly clear nullable values', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T01:23:00Z'));
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({
      id: 'item-a',
      name: 'Before',
      blockers_json: '["思い出"]',
      cover_index: 0,
      memory_note: 'memo',
      price: 3200,
      last_used_at: '2026-01-01',
      location: '棚',
      urgency: 1,
    });

    await dbModule.updateItem('item-a', {
      blockers: [],
      coverIndex: 4,
      lastUsedAt: null,
      memoryNote: null,
      name: '  ',
      price: null,
    });

    expect(fakeDb.itemRows.get('item-a')).toMatchObject({
      blockers_json: '[]',
      cover_index: 0,
      last_used_at: null,
      location: '棚',
      memory_note: null,
      name: '無名',
      price: null,
      urgency: 1,
      updated_at: Date.now(),
    });
  });

  it('does nothing when updating a missing item', async () => {
    const { dbModule, fakeDb } = await loadDbModule();

    await dbModule.updateItem('missing', { name: 'Nope' });

    expect(fakeDb.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('SET name = ?'), expect.anything());
  });

  it('appends photos after the current max sort order and touches the item', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T03:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A', updated_at: 10 }, ['first']);

    await dbModule.addPhotoToItem('item-a', 'second');

    expect(fakeDb.photoRows.filter((row) => row.item_id === 'item-a').map((row) => [row.uri, row.sort_order])).toEqual([
      ['first', 0],
      ['second', 1],
    ]);
    expect(fakeDb.itemRows.get('item-a')?.updated_at).toBe(Date.now());
  });

  it('releases, restores, and deletes item records with photo cleanup by cascade', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T04:00:00Z'));
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A' }, ['photo-a']);

    await dbModule.releaseItem('item-a');
    expect(fakeDb.itemRows.get('item-a')).toMatchObject({
      released_at: Date.now(),
      status: 'discarded',
      updated_at: Date.now(),
    });

    vi.setSystemTime(new Date('2026-07-05T05:00:00Z'));
    await dbModule.restoreItem('item-a');
    expect(fakeDb.itemRows.get('item-a')).toMatchObject({
      released_at: null,
      status: 'candidate',
      updated_at: Date.now(),
    });

    await dbModule.deleteItem('item-a');
    expect(fakeDb.itemRows.has('item-a')).toBe(false);
    expect(fakeDb.photoRows.filter((row) => row.item_id === 'item-a')).toEqual([]);
  });

  it('rejects creating an item with no photos or an invalid urgency', async () => {
    const { dbModule, fakeDb } = await loadDbModule();

    await expect(dbModule.createItemFromPhotos({ photos: [], urgency: 1 })).rejects.toThrow('写真は1枚以上必要です。');
    await expect(
      dbModule.createItemFromPhotos({ photos: ['photo-1'], urgency: 9 as never })
    ).rejects.toThrow(/urgency/);
    expect(fakeDb.itemRows.size).toBe(0);
  });

  it('rejects updating an item to an invalid urgency', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A' }, ['photo-1']);

    await expect(dbModule.updateItem('item-a', { urgency: 5 as never })).rejects.toThrow(/urgency/);
    expect(fakeDb.itemRows.get('item-a')?.urgency).toBe(1);
  });

  it('normalizes blockers and clamps coverIndex on update', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A' }, ['p1', 'p2']);

    await dbModule.updateItem('item-a', {
      blockers: [' 思い出 ', '#高かった', '  '],
      coverIndex: 9,
    });

    expect(fakeDb.itemRows.get('item-a')).toMatchObject({
      blockers_json: '["思い出","高かった"]',
      cover_index: 1,
    });
  });

  it('hydrates broken rows into safe values instead of leaking them to the UI', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem(
      {
        id: 'broken',
        name: 'Broken',
        cover_index: 9,
        urgency: 9,
        status: 'bogus' as never,
      },
      ['p1', 'p2']
    );

    await expect(dbModule.getItem('broken')).resolves.toMatchObject({
      coverIndex: 1,
      urgency: 3,
      status: 'candidate',
    });
  });

  it('removes a non-cover photo, renumbers sort order, and keeps the cover photo', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A', cover_index: 2 }, ['p0', 'p1', 'p2']);

    const result = await dbModule.removePhotoFromItem('item-a', 0);

    expect(result).toEqual({ removedUri: 'p0', coverIndex: 1, photos: ['p1', 'p2'] });
    expect(
      fakeDb.photoRows.filter((row) => row.item_id === 'item-a').map((row) => [row.uri, row.sort_order])
    ).toEqual([
      ['p1', 0],
      ['p2', 1],
    ]);
    expect(fakeDb.itemRows.get('item-a')?.cover_index).toBe(1);
  });

  it('moves the cover to min(deletedIndex, remaining - 1) when the cover photo is removed', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A', cover_index: 2 }, ['p0', 'p1', 'p2']);

    const result = await dbModule.removePhotoFromItem('item-a', 2);

    expect(result).toEqual({ removedUri: 'p2', coverIndex: 1, photos: ['p0', 'p1'] });
  });

  it('refuses to remove the last photo or photos of a broken item', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'single', name: 'Single' }, ['only']);
    fakeDb.seedItem({ id: 'broken', name: 'Broken' }, []);

    await expect(dbModule.removePhotoFromItem('single', 0)).rejects.toThrow('写真は1枚以上必要です。');
    await expect(dbModule.removePhotoFromItem('broken', 0)).rejects.toThrow('写真の記録が壊れています。');
    expect(fakeDb.photoRows.filter((row) => row.item_id === 'single')).toHaveLength(1);
  });

  it('sets the cover photo with clamping', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A' }, ['p0', 'p1']);

    await expect(dbModule.setCoverPhoto('item-a', 1)).resolves.toBe(1);
    expect(fakeDb.itemRows.get('item-a')?.cover_index).toBe(1);

    await expect(dbModule.setCoverPhoto('item-a', 9)).resolves.toBe(1);
    await expect(dbModule.setCoverPhoto('empty', 0)).rejects.toThrow('写真の記録が壊れています。');
  });

  it('reorders photos, renumbers from zero, and follows the cover photo', async () => {
    const { dbModule, fakeDb } = await loadDbModule();
    fakeDb.seedItem({ id: 'item-a', name: 'Item A', cover_index: 0 }, ['p0', 'p1', 'p2']);

    const result = await dbModule.reorderItemPhotos('item-a', 0, 2);

    expect(result).toEqual({ coverIndex: 2, photos: ['p1', 'p2', 'p0'] });
    expect(
      fakeDb.photoRows
        .filter((row) => row.item_id === 'item-a')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => row.uri)
    ).toEqual(['p1', 'p2', 'p0']);
    expect(fakeDb.itemRows.get('item-a')?.cover_index).toBe(2);
  });

  it('seeds sample data only when the explicit seed flag is enabled', async () => {
    process.env.EXPO_PUBLIC_SEED_SAMPLE_DATA = '1';
    const { dbModule, fakeDb } = await loadDbModule();

    await dbModule.getDatabase();

    expect(fakeDb.itemRows.has('sample-mug')).toBe(true);
    expect(fakeDb.itemRows.has('discarded-sneaker')).toBe(true);
    expect(fakeDb.photoRows.some((row) => row.item_id === 'sample-mug')).toBe(true);
  });
});
