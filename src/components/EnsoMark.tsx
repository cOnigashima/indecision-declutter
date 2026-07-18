import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ensoRevealFrames } from '../assets/enso-reveal';
import { revealFrameIndex, settleDelayMs } from '../lib/ensoReveal';
import { colors } from '../theme/tokens';

const toneColor = {
  blue: colors.kachi,
  shu: colors.shu,
  gray: colors.nibiiro,
} as const;

export type EnsoTone = keyof typeof toneColor;

type EnsoMarkProps = {
  tone?: EnsoTone;
  size?: number;
  animated?: boolean;
  durationMs?: number;
  opacity?: number;
};

const FINAL_FRAME = ensoRevealFrames.length - 1;

// 一筆書きリビールは元々 SVG の 2 枚マスク + reanimated で駆動していたが、
// RN 0.86 Fabric + react-native-svg の iOS では Mask 内ノードの更新が
// ネイティブ描画に反映されず、途中の弧で凍結する（rAF + setState 駆動や
// 強制再描画でも解消しないことを実機で確認済み。openspec の change 参照）。
// そのためリビールを事前レンダリングの連番フレーム
// （scripts/generate-enso-reveal-frames.mjs が生成、イージング焼き込み済み）
// にし、実機で動作実績のある expo-image の表示だけで再生する。
// 全フレームを重ねて opacity で切り替えるので、再生中のデコード待ちも無い。
export function EnsoMark({
  tone = 'blue',
  size = 190,
  animated = false,
  durationMs = 420,
  opacity = 1,
}: EnsoMarkProps) {
  const [frame, setFrame] = useState(animated ? 0 : FINAL_FRAME);
  const [settled, setSettled] = useState(!animated);

  useEffect(() => {
    if (!animated) {
      setFrame(FINAL_FRAME);
      setSettled(true);
      return;
    }

    setFrame(0);
    setSettled(false);

    let rafId = 0;
    let startedAt: number | null = null;
    const tick = (now: number) => {
      if (startedAt === null) {
        startedAt = now;
      }
      const elapsed = now - startedAt;
      setFrame(revealFrameIndex(elapsed, durationMs, ensoRevealFrames.length));
      if (elapsed < durationMs) {
        rafId = requestAnimationFrame(tick);
      } else {
        setSettled(true);
      }
    };
    rafId = requestAnimationFrame(tick);

    // 完走保証。rAF が止まっても必ずフルの円相へ収束させる。
    const settleTimer = setTimeout(() => {
      setSettled(true);
    }, settleDelayMs(durationMs));

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
    };
  }, [animated, durationMs]);

  const tint = toneColor[tone];

  if (settled) {
    return (
      <View style={{ width: size, height: size, opacity }}>
        <Image
          source={ensoRevealFrames[FINAL_FRAME]}
          contentFit="contain"
          tintColor={tint}
          style={styles.fill}
        />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, opacity }}>
      {ensoRevealFrames.map((source, index) => (
        <Image
          key={index}
          source={source}
          contentFit="contain"
          tintColor={tint}
          style={[styles.frame, { opacity: index === frame ? 1 : 0 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
