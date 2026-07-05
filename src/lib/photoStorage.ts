import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { createId } from './db';

const PHOTO_DIR_NAME = 'indecision-photos';
const MAX_PHOTO_WIDTH = 1440;
const PHOTO_QUALITY = 0.82;

export async function captureAndStorePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('カメラの権限がありません。設定からカメラを許可してください。');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    exif: false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return storePhoto(result.assets[0].uri, result.assets[0].width);
}

export async function pickAndStorePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    exif: false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return storePhoto(result.assets[0].uri, result.assets[0].width);
}

export async function deleteStoredPhoto(uri: string): Promise<void> {
  if (!isStoredPhotoUri(uri)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // File cleanup should not block the record operation that requested it.
  }
}

async function storePhoto(sourceUri: string, width?: number): Promise<string> {
  const actions = width && width > MAX_PHOTO_WIDTH ? [{ resize: { width: MAX_PHOTO_WIDTH } }] : [];
  const normalized = await ImageManipulator.manipulateAsync(sourceUri, actions, {
    base64: !FileSystem.documentDirectory,
    compress: PHOTO_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  if (!FileSystem.documentDirectory) {
    if (!normalized.base64) {
      return normalized.uri;
    }
    return `data:image/jpeg;base64,${normalized.base64}`;
  }

  const directory = await ensurePhotoDirectory();
  const targetUri = `${directory}${createId('photo')}.jpg`;

  await FileSystem.copyAsync({ from: normalized.uri, to: targetUri });
  await deleteTemporaryFile(normalized.uri, sourceUri);

  return targetUri;
}

function isStoredPhotoUri(uri: string): boolean {
  return !!FileSystem.documentDirectory && uri.startsWith(`${FileSystem.documentDirectory}${PHOTO_DIR_NAME}/`);
}

async function ensurePhotoDirectory(): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('写真の保存先を取得できませんでした。');
  }

  const directory = `${FileSystem.documentDirectory}${PHOTO_DIR_NAME}/`;
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  return directory;
}

async function deleteTemporaryFile(uri: string, originalUri: string): Promise<void> {
  if (uri === originalUri || !uri.startsWith('file:')) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Cache cleanup is opportunistic; persistence already happened by this point.
  }
}
