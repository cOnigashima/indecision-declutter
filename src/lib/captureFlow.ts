/**
 * 「撮ってから写しを収める」の芯をロジックに固定する。item作成アクションは写真が
 * 1枚以上あるときにだけ提示してよい（写真ゼロで item を作らない）。
 */
export function canRelease(photos: readonly string[]): boolean {
  return photos.length >= 1;
}
