import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createId: vi.fn(),
  fileSystem: {
    documentDirectory: 'file:///document/' as string | null,
    copyAsync: vi.fn(),
    deleteAsync: vi.fn(),
    getInfoAsync: vi.fn(),
    makeDirectoryAsync: vi.fn(),
  },
  imageManipulator: {
    SaveFormat: {
      JPEG: 'jpeg',
    },
    manipulateAsync: vi.fn(),
  },
  imagePicker: {
    launchCameraAsync: vi.fn(),
    launchImageLibraryAsync: vi.fn(),
    requestCameraPermissionsAsync: vi.fn(),
  },
}));

vi.mock('expo-file-system/legacy', () => mocks.fileSystem);
vi.mock('expo-image-manipulator', () => mocks.imageManipulator);
vi.mock('expo-image-picker', () => mocks.imagePicker);
vi.mock('./db', () => ({ createId: mocks.createId }));

import { captureAndStorePhoto, deleteStoredPhoto, pickAndStorePhoto } from './photoStorage';

describe('photoStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fileSystem.documentDirectory = 'file:///document/';
    mocks.fileSystem.getInfoAsync.mockResolvedValue({ exists: true });
    mocks.imageManipulator.manipulateAsync.mockResolvedValue({ uri: 'file:///cache/normalized.jpg' });
    mocks.createId.mockReturnValue('photo-fixed');
  });

  it('throws a helpful error when camera permission is denied', async () => {
    mocks.imagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(captureAndStorePhoto()).rejects.toThrow('カメラの権限がありません。設定からカメラを許可してください。');
    expect(mocks.imagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(mocks.imageManipulator.manipulateAsync).not.toHaveBeenCalled();
  });

  it('returns null when camera capture is canceled', async () => {
    mocks.imagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mocks.imagePicker.launchCameraAsync.mockResolvedValue({ assets: [], canceled: true });

    await expect(captureAndStorePhoto()).resolves.toBeNull();
    expect(mocks.imageManipulator.manipulateAsync).not.toHaveBeenCalled();
  });

  it('resizes wide camera photos, persists them under the app photo directory, and removes cache files', async () => {
    mocks.imagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mocks.imagePicker.launchCameraAsync.mockResolvedValue({
      assets: [{ uri: 'file:///camera/original.jpg', width: 2200 }],
      canceled: false,
    });

    await expect(captureAndStorePhoto()).resolves.toBe('file:///document/indecision-photos/photo-fixed.jpg');

    expect(mocks.imagePicker.launchCameraAsync).toHaveBeenCalledWith({
      exif: false,
      mediaTypes: ['images'],
      quality: 0.9,
    });
    expect(mocks.imageManipulator.manipulateAsync).toHaveBeenCalledWith(
      'file:///camera/original.jpg',
      [{ resize: { width: 1440 } }],
      { base64: false, compress: 0.82, format: 'jpeg' }
    );
    expect(mocks.fileSystem.getInfoAsync).toHaveBeenCalledWith('file:///document/indecision-photos/');
    expect(mocks.fileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    expect(mocks.fileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///cache/normalized.jpg',
      to: 'file:///document/indecision-photos/photo-fixed.jpg',
    });
    expect(mocks.fileSystem.deleteAsync).toHaveBeenCalledWith('file:///cache/normalized.jpg', { idempotent: true });
  });

  it('creates the photo directory and skips resizing for photos already within the size limit', async () => {
    mocks.fileSystem.getInfoAsync.mockResolvedValue({ exists: false });
    mocks.imagePicker.launchImageLibraryAsync.mockResolvedValue({
      assets: [{ uri: 'file:///library/photo.jpg', width: 1024 }],
      canceled: false,
    });
    mocks.imageManipulator.manipulateAsync.mockResolvedValue({ uri: 'file:///library/photo.jpg' });

    await expect(pickAndStorePhoto()).resolves.toBe('file:///document/indecision-photos/photo-fixed.jpg');

    expect(mocks.imageManipulator.manipulateAsync).toHaveBeenCalledWith(
      'file:///library/photo.jpg',
      [],
      { base64: false, compress: 0.82, format: 'jpeg' }
    );
    expect(mocks.fileSystem.makeDirectoryAsync).toHaveBeenCalledWith('file:///document/indecision-photos/', {
      intermediates: true,
    });
    expect(mocks.fileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('uses a data URI fallback when no document directory is available', async () => {
    mocks.fileSystem.documentDirectory = null;
    mocks.imagePicker.launchImageLibraryAsync.mockResolvedValue({
      assets: [{ uri: 'blob:http://localhost/source', width: 1800 }],
      canceled: false,
    });
    mocks.imageManipulator.manipulateAsync.mockResolvedValue({
      base64: 'encoded-photo',
      uri: 'blob:http://localhost/normalized',
    });

    await expect(pickAndStorePhoto()).resolves.toBe('data:image/jpeg;base64,encoded-photo');

    expect(mocks.imageManipulator.manipulateAsync).toHaveBeenCalledWith(
      'blob:http://localhost/source',
      [{ resize: { width: 1440 } }],
      { base64: true, compress: 0.82, format: 'jpeg' }
    );
    expect(mocks.fileSystem.copyAsync).not.toHaveBeenCalled();
  });

  it('returns the normalized URI on web when base64 output is unavailable', async () => {
    mocks.fileSystem.documentDirectory = null;
    mocks.imagePicker.launchImageLibraryAsync.mockResolvedValue({
      assets: [{ uri: 'blob:http://localhost/source', width: 400 }],
      canceled: false,
    });
    mocks.imageManipulator.manipulateAsync.mockResolvedValue({ uri: 'blob:http://localhost/normalized' });

    await expect(pickAndStorePhoto()).resolves.toBe('blob:http://localhost/normalized');
  });

  it('deletes only app-managed stored photos and ignores cleanup failures', async () => {
    mocks.fileSystem.deleteAsync.mockRejectedValueOnce(new Error('already gone'));

    await expect(deleteStoredPhoto('file:///document/indecision-photos/photo.jpg')).resolves.toBeUndefined();
    await expect(deleteStoredPhoto('file:///outside/photo.jpg')).resolves.toBeUndefined();

    expect(mocks.fileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    expect(mocks.fileSystem.deleteAsync).toHaveBeenCalledWith('file:///document/indecision-photos/photo.jpg', {
      idempotent: true,
    });
  });
});
