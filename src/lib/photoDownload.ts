import { isRenderablePhotoUri } from './photoUri';

const FALLBACK_FILE_STEM = '不断捨離';

/**
 * Saves an app photo outside the local-first record: to the device photo
 * library on native, or through the browser's download flow on web.
 */
export async function downloadPhotoToLibrary(uri: string, itemName: string, photoIndex: number): Promise<void> {
  if (!isRenderablePhotoUri(uri)) {
    throw new Error('保存できる画像が見つかりません。');
  }

  const fileName = photoDownloadFileName(itemName, photoIndex);
  if (typeof document !== 'undefined') {
    downloadPhotoOnWeb(uri, fileName);
    return;
  }

  if (!uri.startsWith('file:')) {
    throw new Error('この画像は端末のライブラリに保存できません。');
  }

  const MediaLibrary = await import('expo-media-library');
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error('写真を追加する権限がありません。端末の設定から許可してください。');
  }

  await MediaLibrary.Asset.create(uri);
}

export function photoDownloadFileName(itemName: string, photoIndex: number): string {
  const safeStem = itemName
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || FALLBACK_FILE_STEM;

  return `${safeStem}-${Math.max(0, photoIndex) + 1}.jpg`;
}

function downloadPhotoOnWeb(uri: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = uri;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
