import { useCallback, useEffect, useState } from 'react';

import type { Item } from '../types/item';
import { useItems } from './ItemsContext';

export type ItemLoaderResult = {
  item: Item | null;
  loading: boolean;
  missing: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

/**
 * Resolves an item from the context cache, falling back to the DB so that
 * detail screens survive direct links, state restoration, and refreshes.
 */
export function useItemLoader(itemId: string | undefined): ItemLoaderResult {
  const { findItem, loadItem, loading: itemsLoading } = useItems();
  const cached = itemId ? findItem(itemId) : undefined;
  // Keyed by id so a screen instance whose route params change never shows
  // the previous item while the new one is still loading.
  const [loaded, setLoaded] = useState<{ id: string; item: Item | null } | null>(null);
  const [loading, setLoading] = useState(!cached && !!itemId);
  const [missing, setMissing] = useState(!itemId);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!itemId) {
      setMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await loadItem(itemId);
      setLoaded({ id: itemId, item: next });
      setMissing(!next);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, [itemId, loadItem]);

  useEffect(() => {
    if (cached) {
      setLoading(false);
      setMissing(false);
      setError(null);
      return;
    }
    // Let the context finish its initial list load before falling back to a
    // direct DB read — most lookups resolve from the cache for free.
    if (itemsLoading) {
      return;
    }
    void reload();
  }, [cached, itemsLoading, reload]);

  const fallback = itemId && loaded?.id === itemId ? loaded.item : null;

  return {
    item: cached ?? fallback,
    loading: !cached && loading,
    missing: !cached && missing,
    error: cached ? null : error,
    reload,
  };
}
