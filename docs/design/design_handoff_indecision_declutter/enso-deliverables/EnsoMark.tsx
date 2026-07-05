import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  G,
  Image as SvgImage,
  Mask,
  Path,
  Rect,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import ensoMono from '../assets/enso-mono.png';
import { colors } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const toneColor = {
  blue: colors.kachi, // 勝色
  shu: colors.shu, // 朱
  gray: colors.nibiiro, // 鈍色
} as const;

export type EnsoTone = 'blue' | 'shu' | 'gray';

// カンプ議論 t10 の承認版と同じジオメトリ（viewBox 0..100 / 左下→時計回り）。
// 太いストロークで円の帯を一気にワイプし、筆テクスチャを「一筆で」現す。
const REVEAL_PATH = 'M39 82.8 A35 35 0 1 1 67.5 80.3';
const REVEAL_WIDTH = 34;

type EnsoMarkProps = {
  tone?: EnsoTone;
  size?: number;
  /** true で「一筆で閉じる」描画。false は完成形の静止（テクスチャ全表示）。 */
  animated?: boolean;
  durationMs?: number;
  opacity?: number;
};

/**
 * SVG 版の円相。純ベクターの線ではなく、本物の筆テクスチャ（enso-mono.png）を
 * ・tone 色の Rect × テクスチャ（luminance mask）で染め、
 * ・animated 時のみ reveal マスクを重ねて「一筆で閉じる」描画にする。
 * これで“かすれ質感”を保ったまま SVG のストロークアニメが可能。
 */
export function EnsoMark({
  tone = 'blue',
  size = 190,
  animated = false,
  durationMs = 420,
  opacity = 1,
}: EnsoMarkProps) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    // カンプ議論 t10 承認版と同じ「シャッ」：一気に締める whip イージング。
    progress.value = animated
      ? withTiming(1, { duration: durationMs, easing: Easing.bezier(0.55, 0, 1, 0.96) })
      : 1;
  }, [animated, durationMs, progress]);

  const revealProps = useAnimatedProps(() => ({
    strokeDashoffset: 100 * (1 - progress.value),
  }));

  const texId = `enso-tex-${tone}`;
  const revId = `enso-rev-${tone}`;

  // tone 色をテクスチャで抜いた「色付き円相」
  const tinted = (
    <Rect
      x={0}
      y={0}
      width={100}
      height={100}
      fill={toneColor[tone]}
      mask={`url(#${texId})`}
    />
  );

  return (
    <View style={{ width: size, height: size, opacity }}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <Defs>
          <Mask id={texId} maskUnits="userSpaceOnUse">
            {/* 白インクのテクスチャ = luminance マスク */}
            <SvgImage
              href={ensoMono}
              x={0}
              y={0}
              width={100}
              height={100}
              preserveAspectRatio="xMidYMid meet"
            />
          </Mask>
          <Mask id={revId} maskUnits="userSpaceOnUse">
            <AnimatedPath
              d={REVEAL_PATH}
              stroke="#fff"
              strokeWidth={REVEAL_WIDTH}
              strokeLinecap="round"
              fill="none"
              pathLength={100}
              strokeDasharray={100}
              animatedProps={revealProps}
            />
          </Mask>
        </Defs>

        {animated ? <G mask={`url(#${revId})`}>{tinted}</G> : tinted}
      </Svg>
    </View>
  );
}
