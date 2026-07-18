// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { addPhotoToItem, listItems } from '../lib/db';
import { deleteStoredPhoto } from '../lib/photoStorage';
import { ItemsProvider, useItems } from './ItemsContext';

const addPhotoToItemMock = vi.mocked(addPhotoToItem);
const listItemsMock = vi.mocked(listItems);
const deleteStoredPhotoMock = vi.mocked(deleteStoredPhoto);

const wrapper = ({ children }: { children: ReactNode }) => <ItemsProvider>{children}</ItemsProvider>;

async function renderItems() {
  const rendered = renderHook(() => useItems(), { wrapper });
  await waitFor(() => expect(listItemsMock).toHaveBeenCalled());
  return rendered;
}

describe('ItemsContext.addPhoto orphan cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listItemsMock.mockResolvedValue([]);
    deleteStoredPhotoMock.mockResolvedValue(undefined);
  });

  // The cleanup path is source-agnostic: the caller passes an already-stored URI
  // whether it came from the camera or the library, so one guarantee covers both.
  it('deletes the stored file and rethrows when the DB add fails', async () => {
    addPhotoToItemMock.mockRejectedValue(new Error('db down'));
    const { result } = await renderItems();

    await act(async () => {
      await expect(result.current.addPhoto('item-1', 'library-orphan.jpg')).rejects.toThrow('db down');
    });

    expect(deleteStoredPhotoMock).toHaveBeenCalledWith('library-orphan.jpg');
  });

  it('keeps the file when the DB add succeeds', async () => {
    addPhotoToItemMock.mockResolvedValue(undefined);
    const { result } = await renderItems();

    await act(async () => {
      await result.current.addPhoto('item-1', 'kept.jpg');
    });

    expect(addPhotoToItemMock).toHaveBeenCalledWith('item-1', 'kept.jpg');
    expect(deleteStoredPhotoMock).not.toHaveBeenCalled();
  });
});
