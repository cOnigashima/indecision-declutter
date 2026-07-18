// 円相の一筆書きリビール（連番フレーム再生）の駆動ロジック。
// フレーム自体は scripts/generate-enso-reveal-frames.mjs が事前レンダリング
// する（弧の幾何・イージングはそちらに焼き込み済み）。ここは再生側の
// 「経過時間 → フレーム番号」の写像と収束条件だけを持つ。

// イージングはフレーム生成時に焼き込み済みなので、ここは時間軸に対して線形。
export function revealFrameIndex(
  elapsedMs: number,
  durationMs: number,
  frameCount: number
): number {
  if (frameCount <= 1) {
    return 0;
  }
  if (durationMs <= 0 || elapsedMs >= durationMs) {
    return frameCount - 1;
  }
  if (elapsedMs <= 0) {
    return 0;
  }
  return Math.min(frameCount - 1, Math.floor((elapsedMs / durationMs) * frameCount));
}

// 収束（settle）はアニメ駆動と独立のタイマーで保証する。rAF が 1 フレームも
// 走らなくても、この遅延の後には必ずフルの円相へ切り替える。
export const SETTLE_GRACE_MS = 80;

export function settleDelayMs(durationMs: number): number {
  return Math.max(0, durationMs) + SETTLE_GRACE_MS;
}
