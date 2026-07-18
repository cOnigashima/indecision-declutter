// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mediaLibrary = vi.hoisted(() => ({
  create: vi.fn(),
  requestPermissionsAsync: vi.fn(),
}));

vi.mock('expo-media-library', () => ({
  Asset: { create: mediaLibrary.create },
  requestPermissionsAsync: mediaLibrary.requestPermissionsAsync,
}));

import { downloadPhotoToLibrary, photoDownloadFileName } from './photoDownload';

describe('photoDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    mediaLibrary.requestPermissionsAsync.mockResolvedValue({ granted: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a readable, filesystem-safe download name', () => {
    expect(photoDownloadFileName(' 祖母の / マグカップ ', 1)).toBe('祖母の-マグカップ-2.jpg');
    expect(photoDownloadFileName('   ', -1)).toBe('不断捨離-1.jpg');
  });

  it('uses the browser download flow on web', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await downloadPhotoToLibrary('data:image/jpeg;base64,photo', '昔のCD', 0);

    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a')).toBeNull();
    click.mockRestore();
  });

  it('rejects placeholder values that are not image URIs', async () => {
    await expect(downloadPhotoToLibrary('sample-photo-1', 'サンプル', 0)).rejects.toThrow(
      '保存できる画像が見つかりません。'
    );
  });

  it('requests add-only permission and creates an asset on native', async () => {
    vi.stubGlobal('document', undefined);

    await downloadPhotoToLibrary('file:///document/indecision-photos/photo.jpg', '昔のCD', 0);

    expect(mediaLibrary.requestPermissionsAsync).toHaveBeenCalledWith(true);
    expect(mediaLibrary.create).toHaveBeenCalledWith('file:///document/indecision-photos/photo.jpg');
  });

  it('explains how to recover when native photo permission is denied', async () => {
    vi.stubGlobal('document', undefined);
    mediaLibrary.requestPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(downloadPhotoToLibrary('file:///document/photo.jpg', '昔のCD', 0)).rejects.toThrow(
      '写真を追加する権限がありません。端末の設定から許可してください。'
    );
    expect(mediaLibrary.create).not.toHaveBeenCalled();
  });
});
