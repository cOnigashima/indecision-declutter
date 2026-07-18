// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/photoStorage', () => ({
  captureAndStorePhoto: vi.fn(),
  pickAndStorePhoto: vi.fn(),
  deleteStoredPhoto: vi.fn(),
}));

import { captureAndStorePhoto, deleteStoredPhoto, pickAndStorePhoto } from '../../lib/photoStorage';
import { useCaptureDraft } from './useCaptureDraft';

const captureMock = vi.mocked(captureAndStorePhoto);
const pickMock = vi.mocked(pickAndStorePhoto);
const deleteMock = vi.mocked(deleteStoredPhoto);

describe('useCaptureDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMock.mockResolvedValue(undefined);
  });

  it('appends captured photos and activates the newest one', async () => {
    captureMock.mockResolvedValueOnce('a.jpg').mockResolvedValueOnce('b.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.takePhoto();
    });

    expect(result.current.photos).toEqual(['a.jpg', 'b.jpg']);
    expect(result.current.activeIndex).toBe(1);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('appends a library pick to the same draft as camera captures', async () => {
    captureMock.mockResolvedValueOnce('shot.jpg');
    pickMock.mockResolvedValueOnce('library.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.pickPhoto();
    });

    expect(result.current.photos).toEqual(['shot.jpg', 'library.jpg']);
    expect(result.current.activeIndex).toBe(1);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('accepts an in-app camera acquirer without launching the system camera', async () => {
    const acquire = vi.fn().mockResolvedValue('camera-view.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto(acquire);
    });

    expect(acquire).toHaveBeenCalledTimes(1);
    expect(captureMock).not.toHaveBeenCalled();
    expect(result.current.photos).toEqual(['camera-view.jpg']);
  });

  it('keeps the draft when a capture is cancelled', async () => {
    captureMock.mockResolvedValueOnce('a.jpg').mockResolvedValueOnce(null);
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.takePhoto();
    });

    expect(result.current.photos).toEqual(['a.jpg']);
    expect(result.current.error).toBeNull();
  });

  it('surfaces capture errors without touching existing photos', async () => {
    captureMock.mockResolvedValueOnce('a.jpg').mockRejectedValueOnce(new Error('カメラの権限がありません。'));
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.takePhoto();
    });

    expect(result.current.photos).toEqual(['a.jpg']);
    expect(result.current.error).toBe('カメラの権限がありません。');
  });

  it('retake replaces only the active photo and deletes the replaced file', async () => {
    captureMock
      .mockResolvedValueOnce('a.jpg')
      .mockResolvedValueOnce('b.jpg')
      .mockResolvedValueOnce('retake.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.takePhoto();
    });
    act(() => {
      result.current.selectPhoto(0);
    });
    await act(async () => {
      await result.current.retakePhoto();
    });

    expect(result.current.photos).toEqual(['retake.jpg', 'b.jpg']);
    expect(result.current.activeIndex).toBe(0);
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith('a.jpg');
  });

  it('retake keeps the draft when the new capture is cancelled', async () => {
    captureMock.mockResolvedValueOnce('a.jpg').mockResolvedValueOnce(null);
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.retakePhoto();
    });

    expect(result.current.photos).toEqual(['a.jpg']);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('retake can replace the active photo from a custom source', async () => {
    captureMock.mockResolvedValueOnce('a.jpg');
    const acquire = vi.fn().mockResolvedValue('replacement.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.retakePhoto(acquire);
    });

    expect(result.current.photos).toEqual(['replacement.jpg']);
    expect(deleteMock).toHaveBeenCalledWith('a.jpg');
  });

  it('cancelDraft deletes every draft file and resets the draft', async () => {
    captureMock.mockResolvedValueOnce('a.jpg').mockResolvedValueOnce('b.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
      await result.current.takePhoto();
      await result.current.cancelDraft();
    });

    expect(result.current.photos).toEqual([]);
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(deleteMock).toHaveBeenCalledWith('a.jpg');
    expect(deleteMock).toHaveBeenCalledWith('b.jpg');
  });

  it('releaseDraft resets without deleting files because the item now owns them', async () => {
    captureMock.mockResolvedValueOnce('a.jpg');
    const { result } = renderHook(() => useCaptureDraft());

    await act(async () => {
      await result.current.takePhoto();
    });
    act(() => {
      result.current.releaseDraft();
    });

    expect(result.current.photos).toEqual([]);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
