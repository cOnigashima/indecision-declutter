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

import { listItems, removePhotoFromItem, reorderItemPhotos, setCoverPhoto } from '../lib/db';
import { deleteStoredPhoto } from '../lib/photoStorage';
import { ItemsProvider } from './ItemsContext';
import { usePhotoActions } from './usePhotoActions';

const listItemsMock = vi.mocked(listItems);
const removePhotoFromItemMock = vi.mocked(removePhotoFromItem);
const reorderItemPhotosMock = vi.mocked(reorderItemPhotos);
const setCoverPhotoMock = vi.mocked(setCoverPhoto);
const deleteStoredPhotoMock = vi.mocked(deleteStoredPhoto);

const wrapper = ({ children }: { children: ReactNode }) => <ItemsProvider>{children}</ItemsProvider>;

async function renderActions(itemId: string | undefined) {
  const rendered = renderHook(() => usePhotoActions(itemId), { wrapper });
  await waitFor(() => expect(listItemsMock).toHaveBeenCalled());
  return rendered;
}

describe('usePhotoActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listItemsMock.mockResolvedValue([]);
    deleteStoredPhotoMock.mockResolvedValue(undefined);
  });

  it('removes the photo row first, then cleans up the file and refreshes', async () => {
    removePhotoFromItemMock.mockResolvedValue({ removedUri: 'gone.jpg', coverIndex: 0, photos: ['kept.jpg'] });
    const { result } = await renderActions('item-1');
    listItemsMock.mockClear();

    let removed;
    await act(async () => {
      removed = await result.current.removePhoto(1);
    });

    expect(removed).toEqual({ removedUri: 'gone.jpg', coverIndex: 0, photos: ['kept.jpg'] });
    expect(removePhotoFromItemMock).toHaveBeenCalledWith('item-1', 1);
    expect(deleteStoredPhotoMock).toHaveBeenCalledWith('gone.jpg');
    expect(listItemsMock).toHaveBeenCalled();
  });

  it('tolerates file cleanup failure after a successful DB removal', async () => {
    removePhotoFromItemMock.mockResolvedValue({ removedUri: 'gone.jpg', coverIndex: 0, photos: ['kept.jpg'] });
    deleteStoredPhotoMock.mockRejectedValue(new Error('fs busy'));
    const { result } = await renderActions('item-1');

    await act(async () => {
      await expect(result.current.removePhoto(0)).resolves.toMatchObject({ removedUri: 'gone.jpg' });
    });
  });

  it('does not delete any file when the DB removal fails', async () => {
    removePhotoFromItemMock.mockRejectedValue(new Error('写真は1枚以上必要です。'));
    const { result } = await renderActions('item-1');

    await act(async () => {
      await expect(result.current.removePhoto(0)).rejects.toThrow('写真は1枚以上必要です。');
    });
    expect(deleteStoredPhotoMock).not.toHaveBeenCalled();
  });

  it('sets the cover and reorders photos through the repository', async () => {
    setCoverPhotoMock.mockResolvedValue(2);
    reorderItemPhotosMock.mockResolvedValue({ coverIndex: 1, photos: ['b', 'a'] });
    const { result } = await renderActions('item-1');

    await act(async () => {
      await expect(result.current.setCover(2)).resolves.toBe(2);
      await expect(result.current.movePhoto(0, 1)).resolves.toEqual({ coverIndex: 1, photos: ['b', 'a'] });
    });

    expect(setCoverPhotoMock).toHaveBeenCalledWith('item-1', 2);
    expect(reorderItemPhotosMock).toHaveBeenCalledWith('item-1', 0, 1);
  });

  it('rejects every action without an itemId', async () => {
    const { result } = await renderActions(undefined);

    await act(async () => {
      await expect(result.current.removePhoto(0)).rejects.toThrow('記録が見つかりません。');
      await expect(result.current.setCover(0)).rejects.toThrow('記録が見つかりません。');
      await expect(result.current.movePhoto(0, 1)).rejects.toThrow('記録が見つかりません。');
    });
    expect(removePhotoFromItemMock).not.toHaveBeenCalled();
  });
});
