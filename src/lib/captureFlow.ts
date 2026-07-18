/**
 * 「撮ってから退避」の芯をロジックに固定する。退避アクションは写真が
 * 1枚以上あるときにだけ提示してよい（写真ゼロで退避 item を作らない）。
 */
export function canRelease(photos: readonly string[]): boolean {
  return photos.length >= 1;
}
