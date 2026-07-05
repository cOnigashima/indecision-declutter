import { Check } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors } from '../theme/tokens';

export function BouncyCheck({ size, style }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0);
    Animated.sequence([
      Animated.delay(520),
      Animated.spring(scale, {
        friction: 4,
        tension: 130,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  const opacity = scale.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 0.01, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <Animated.View
      style={[
        styles.check,
        {
          borderRadius: size / 2,
          height: size,
          opacity,
          transform: [{ scale }],
          width: size,
        },
        style,
      ]}
    >
      <Check color="#fff" size={size * 0.54} strokeWidth={2.6} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    backgroundColor: colors.check,
    borderColor: colors.washi,
    borderWidth: 3,
    justifyContent: 'center',
    position: 'absolute',
  },
});
