import { Image } from 'expo-image';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import ensoMono from '../assets/enso-mono.png';
import { colors } from '../theme/tokens';

const toneColor = {
  blue: colors.kachi, // 勝色
  shu: colors.shu, // 朱
  gray: colors.nibiiro, // 鈍色
} as const;

export type EnsoTone = 'blue' | 'shu' | 'gray';

type EnsoImageProps = {
  tone?: EnsoTone;
  size?: number;
  /** true で淡くスケール＋回り込みしながらフェードイン。false なら静止。 */
  animated?: boolean;
  durationMs?: number;
  opacity?: number;
};

/**
 * PNG 版の円相。単一のモノクロ png（enso-mono.png）を tintColor で
 * 青/朱/灰に染め分ける。筆のかすれ質感を残したい場合はこちら。
 * animated は SVG のような一筆描画は不可（フェード＋スケールで代替）。
 */
export function EnsoImage({
  tone = 'blue',
  size = 190,
  animated = false,
  durationMs = 700,
  opacity = 1,
}: EnsoImageProps) {
  const p = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      p.value = withTiming(1, {
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      p.value = 1;
    }
  }, [animated, durationMs, p]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity * p.value,
    transform: [
      { scale: 0.82 + 0.18 * p.value },
      { rotate: `${(1 - p.value) * -12}deg` },
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
