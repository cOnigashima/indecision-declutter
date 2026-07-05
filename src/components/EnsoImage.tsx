import { Image } from 'expo-image';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import ensoMono from '../assets/enso-mono-trimmed.png';
import { colors } from '../theme/tokens';

const toneColor = {
  blue: colors.kachi,
  shu: colors.shu,
  gray: colors.nibiiro,
} as const;

export type EnsoTone = keyof typeof toneColor;

type EnsoImageProps = {
  tone?: EnsoTone;
  size?: number;
  animated?: boolean;
  durationMs?: number;
  opacity?: number;
};

export function EnsoImage({
  tone = 'blue',
  size = 190,
  animated = false,
  durationMs = 700,
  opacity = 1,
}: EnsoImageProps) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    progress.value = animated
      ? withTiming(1, {
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
        })
      : 1;
  }, [animated, durationMs, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity * progress.value,
    transform: [
      { scale: 0.82 + 0.18 * progress.value },
      { rotate: `${(1 - progress.value) * -12}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Image
        source={ensoMono}
        contentFit="contain"
        tintColor={toneColor[tone]}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}
