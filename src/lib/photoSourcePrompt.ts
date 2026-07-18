import { Alert } from 'react-native';

type PhotoSourceHandlers = {
  onCamera: () => void;
  onLibrary: () => void;
};

/**
 * 写真の追加元（カメラ / ライブラリ）を選ばせる最小のプロンプト。
 * 取得後の保存・孤児ファイル後始末は取得元に依らず共通経路で行う。
 */
export function promptPhotoSource({ onCamera, onLibrary }: PhotoSourceHandlers): void {
  Alert.alert('写真を追加', undefined, [
    { text: 'カメラで撮る', onPress: onCamera },
    { text: 'ライブラリから選ぶ', onPress: onLibrary },
    { text: 'やめる', style: 'cancel' },
  ]);
}
