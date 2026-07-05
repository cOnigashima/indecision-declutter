import { useCallback } from 'react';

import {
  removePhotoFromItem,
  reorderItemPhotos,
  setCoverPhoto,
  type RemovePhotoResult,
  type ReorderPhotosResult,
} from '../lib/db';
import { deleteStoredPhoto } from '../lib/photoStorage';
import { useItems } from './ItemsContext';

export type PhotoActions = {
  /** Removes a photo row, then best-effort deletes its file. */
  removePhoto: (photoIndex: number) => Promise<RemovePhotoResult>;
  setCover: (photoIndex: number) => Promise<number>;
  movePhoto: (fromIndex: number, toIndex: number) => Promise<ReorderPhotosResult>;
};

/**
 * Use-case API for mutating an item's photos. Hides the DB-first ordering:
 * the record is the source of truth, file cleanup follows and never fails
 * the operation.
 */
export function usePhotoActions(itemId: string | undefined): PhotoActions {
  const { refreshItems } = useItems();

  const removePhoto = useCallback(
    async (photoIndex: number): Promise<RemovePhotoResult> => {
      if (!itemId) {
        throw new Error('記録が見つかりません。');
      }
      const result = await removePhotoFromItem(itemId, photoIndex);
      try {
        await deleteStoredPhoto(result.removedUri);
      } catch {
        // The row is already gone; a leftover file must not fail the removal.
      }
      await refreshItems();
      return result;
    },
    [itemId, refreshItems]
  );

  const setCover = useCallback(
    async (photoIndex: number): Promise<number> => {
      if (!itemId) {
        throw new Error('記録が見つかりません。');
      }
      const coverIndex = await setCoverPhoto(itemId, photoIndex);
      await refreshItems();
      return coverIndex;
    },
    [itemId, refreshItems]
  );

  const movePhoto = useCallback(
    async (fromIndex: number, toIndex: number): Promise<ReorderPhotosResult> => {
      if (!itemId) {
        throw new Error('記録が見つかりません。');
      }
      const result = await reorderItemPhotos(itemId, fromIndex, toIndex);
      await refreshItems();
      return result;
    },
    [itemId, refreshItems]
  );

  return { removePhoto, setCover, movePhoto };
}
