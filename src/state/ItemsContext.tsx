import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  addPhotoToItem,
  createItemFromPhotos,
  deleteItem,
  getItem,
  listItems,
  releaseItem,
  restoreItem,
  updateItem,
} from '../lib/db';
import { deleteStoredPhoto } from '../lib/photoStorage';
import type { Item, UrgencyLevel } from '../types/item';

type CreateItemInput = {
  photos: string[];
  urgency: UrgencyLevel;
  name?: string;
  blockers?: string[];
  memoryNote?: string;
};

type UpdateItemInput = Parameters<typeof updateItem>[1];

type ItemsContextValue = {
  candidates: Item[];
  discarded: Item[];
  loading: boolean;
  error: Error | null;
  refreshItems: () => Promise<void>;
  findItem: (id: string) => Item | undefined;
  loadItem: (id: string) => Promise<Item | null>;
  createItem: (input: CreateItemInput) => Promise<string>;
  updateExistingItem: (id: string, patch: UpdateItemInput) => Promise<void>;
  addPhoto: (itemId: string, uri: string) => Promise<void>;
  removeExistingItem: (itemId: string) => Promise<void>;
  releaseExistingItem: (itemId: string) => Promise<void>;
  restoreExistingItem: (itemId: string) => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Item[]>([]);
  const [discarded, setDiscarded] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshItems = useCallback(async () => {
    setError(null);
    try {
      const [nextCandidates, nextDiscarded] = await Promise.all([
        listItems('candidate'),
        listItems('discarded'),
      ]);
      setCandidates(nextCandidates);
      setDiscarded(nextDiscarded);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshItems();
  }, [refreshItems]);

  const findItem = useCallback(
    (id: string) => [...candidates, ...discarded].find((item) => item.id === id),
    [candidates, discarded]
  );

  const loadItem = useCallback(
    async (id: string) => {
      const cached = findItem(id);
      if (cached) {
        return cached;
      }
      return getItem(id);
    },
    [findItem]
  );

  const createItem = useCallback(
    async (input: CreateItemInput) => {
      const id = await createItemFromPhotos(input);
      await refreshItems();
      return id;
    },
    [refreshItems]
  );

  const updateExistingItem = useCallback(
    async (id: string, patch: UpdateItemInput) => {
      await updateItem(id, patch);
      await refreshItems();
    },
    [refreshItems]
  );

  const addPhoto = useCallback(
    async (itemId: string, uri: string) => {
      try {
        await addPhotoToItem(itemId, uri);
      } catch (caught) {
        // The DB record is the source of truth; an unrecorded photo file is an orphan.
        await deleteStoredPhoto(uri);
        throw caught;
      }
      await refreshItems();
    },
    [refreshItems]
  );

  const removeExistingItem = useCallback(
    async (itemId: string) => {
      const item = await getItem(itemId);
      await deleteItem(itemId);
      await Promise.all((item?.photos ?? []).map((photo) => deleteStoredPhoto(photo)));
      await refreshItems();
    },
    [refreshItems]
  );

  const releaseExistingItem = useCallback(
    async (itemId: string) => {
      await releaseItem(itemId);
      await refreshItems();
    },
    [refreshItems]
  );

  const restoreExistingItem = useCallback(
    async (itemId: string) => {
      await restoreItem(itemId);
      await refreshItems();
    },
    [refreshItems]
  );

  const value = useMemo<ItemsContextValue>(
    () => ({
      candidates,
      discarded,
      loading,
      error,
      refreshItems,
      findItem,
      loadItem,
      createItem,
      updateExistingItem,
      addPhoto,
      removeExistingItem,
      releaseExistingItem,
      restoreExistingItem,
    }),
    [
      addPhoto,
      candidates,
      createItem,
      discarded,
      error,
      findItem,
      loadItem,
      loading,
      removeExistingItem,
      refreshItems,
      releaseExistingItem,
      restoreExistingItem,
      updateExistingItem,
    ]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within ItemsProvider');
  }
  return context;
}
