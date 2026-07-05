import { useEffect, useId } from 'react';
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

import ensoMono from '../assets/enso-mono-trimmed-solid.png';
import { colors } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const toneColor = {
  blue: colors.kachi,
  shu: colors.shu,
  gray: colors.nibiiro,
} as const;

export type EnsoTone = keyof typeof toneColor;

const REVEAL_PATH = 'M39 82.8 A35 35 0 1 1 67.5 80.3';
const REVEAL_WIDTH = 34;
const REVEAL_LENGTH = 220;

type EnsoMarkProps = {
  tone?: EnsoTone;
  size?: number;
  animated?: boolean;
  durationMs?: number;
  opacity?: number;
};

export function EnsoMark({
  tone = 'blue',
  size = 190,
  animated = false,
  durationMs = 420,
  opacity = 1,
}: EnsoMarkProps) {
  const id = useId().replace(/:/g, '');
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    progress.value = animated
      ? withTiming(1, {
          duration: durationMs,
          easing: Easing.bezier(0.55, 0, 1, 0.96),
        })
      : 1;
  }, [animated, durationMs, progress]);

  const revealProps = useAnimatedProps(() => ({
    strokeDashoffset: REVEAL_LENGTH * (1 - progress.value),
  }));

  const texId = `enso-tex-${tone}-${id}`;
  const revId = `enso-rev-${tone}-${id}`;
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
              strokeDasharray={REVEAL_LENGTH}
              animatedProps={revealProps}
            />
          </Mask>
        </Defs>

        {animated ? <G mask={`url(#${revId})`}>{tinted}</G> : tinted}
      </Svg>
    </View>
  );
}
