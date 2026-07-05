// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Item } from '../types/item';

vi.mock('../lib/db', () => ({
  addPhotoToItem: vi.fn(),
  createItemFromPhotos: vi.fn(),
  deleteItem: vi.fn(),
  getItem: vi.fn(),
  listItems: vi.fn(),
  releaseItem: vi.fn(),
  restoreItem: vi.fn(),
  updateItem: vi.fn(),
  removePhotoFromItem: vi.fn(),
  reorderItemPhotos: vi.fn(),
  setCoverPhoto: vi.fn(),
}));

vi.mock('../lib/photoStorage', () => ({
  deleteStoredPhoto: vi.fn(),
}));

import { getItem, listItems } from '../lib/db';
import { ItemsProvider } from './ItemsContext';
import { useItemLoader } from './useItemLoader';

const listItemsMock = vi.mocked(listItems);
const getItemMock = vi.mocked(getItem);

function makeItem(id: string): Item {
  return {
    id,
    name: `Item ${id}`,
    photos: [`photo-${id}`],
    coverIndex: 0,
    urgency: 1,
    status: 'candidate',
    blockers: [],
    createdAt: 1,
    updatedAt: 1,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => <ItemsProvider>{children}</ItemsProvider>;

describe('useItemLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listItemsMock.mockResolvedValue([]);
    getItemMock.mockResolvedValue(null);
  });

  it('serves an item straight from the context cache without hitting the DB', async () => {
    const cached = makeItem('cached');
    listItemsMock.mockImplementation(async (status) => (status === 'candidate' ? [cached] : []));

    const { result } = renderHook(() => useItemLoader('cached'), { wrapper });

    await waitFor(() => expect(result.current.item).toEqual(cached));
    expect(result.current.loading).toBe(false);
    expect(result.current.missing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getItemMock).not.toHaveBeenCalled();
  });

  it('falls back to the DB when the cache misses', async () => {
    const stored = makeItem('direct-link');
    getItemMock.mockResolvedValue(stored);

    const { result } = renderHook(() => useItemLoader('direct-link'), { wrapper });

    await waitFor(() => expect(result.current.item).toEqual(stored));
    expect(result.current.loading).toBe(false);
    expect(result.current.missing).toBe(false);
    expect(getItemMock).toHaveBeenCalledWith('direct-link');
  });

  it('reports missing when neither cache nor DB has the item', async () => {
    const { result } = renderHook(() => useItemLoader('ghost'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.item).toBeNull();
    expect(result.current.missing).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a load error', async () => {
    getItemMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useItemLoader('broken'), { wrapper });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe('boom');
    expect(result.current.item).toBeNull();
  });

  it('does not show the previous item while a new itemId is loading', async () => {
    const first = makeItem('first');
    let resolveSecond: (item: Item | null) => void = () => undefined;
    getItemMock.mockImplementation(async (id) => {
      if (id === 'first') {
        return first;
      }
      return new Promise((resolve) => {
        resolveSecond = resolve;
      });
    });

    const { rerender, result } = renderHook(({ id }: { id: string }) => useItemLoader(id), {
      initialProps: { id: 'first' },
      wrapper,
    });
    await waitFor(() => expect(result.current.item).toEqual(first));

    rerender({ id: 'second' });
    expect(result.current.item).toBeNull();

    const second = makeItem('second');
    resolveSecond(second);
    await waitFor(() => expect(result.current.item).toEqual(second));
  });
});
