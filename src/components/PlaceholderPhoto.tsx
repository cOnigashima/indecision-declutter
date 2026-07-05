import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme/tokens';

type PlaceholderPhotoProps = {
  label?: string;
  dark?: boolean;
  compact?: boolean;
};

export function PlaceholderPhoto({ label = '写真', dark = false, compact = false }: PlaceholderPhotoProps) {
  return (
    <View style={[styles.photo, dark ? styles.dark : styles.light, compact && styles.compact]}>
      <View style={styles.stripeA} />
      <View style={styles.stripeB} />
      <View style={styles.stripeC} />
      <Text style={[styles.label, dark && styles.darkLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    borderRadius: 12,
    height: 88,
    width: 88,
  },
  dark: {
    backgroundColor: colors.photoDark,
  },
  darkLabel: {
    color: 'rgba(255,255,255,0.28)',
  },
  label: {
    color: 'rgba(0,0,0,0.3)',
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '500',
    zIndex: 2,
  },
  light: {
    backgroundColor: colors.photoLight,
  },
  photo: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  stripeA: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: '160%',
    left: 42,
    position: 'absolute',
    top: -40,
    transform: [{ rotate: '-45deg' }],
    width: 16,
  },
  stripeB: {
    backgroundColor: 'rgba(0,0,0,0.035)',
    height: '160%',
    left: 104,
    position: 'absolute',
    top: -40,
    transform: [{ rotate: '-45deg' }],
    width: 16,
  },
  stripeC: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    height: '160%',
    left: 166,
    position: 'absolute',
    top: -40,
    transform: [{ rotate: '-45deg' }],
    width: 16,
  },
});
