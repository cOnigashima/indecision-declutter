import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { colors, fonts, radii, shadows } from '../theme/tokens';

type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  tone?: 'kachi' | 'sumi' | 'outline' | 'nibiiro';
  icon?: ComponentType<LucideProps>;
};

export function ActionButton({ label, onPress, tone = 'kachi', icon: Icon }: ActionButtonProps) {
  const isOutline = tone === 'outline';
  const backgroundColor = tone === 'sumi' ? colors.sumi : tone === 'nibiiro' ? colors.nibiiro : colors.kachi;
  const color = isOutline ? colors.kachi : colors.washi;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outline : { backgroundColor },
        !isOutline && shadows.button,
        pressed && styles.pressed,
      ]}
    >
      {Icon ? <Icon color={color} size={19} strokeWidth={2.1} /> : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.button,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
  outline: {
    backgroundColor: colors.card,
    borderColor: 'rgba(44,46,99,0.24)',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
