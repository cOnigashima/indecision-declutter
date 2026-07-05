import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/tokens';
import { EnsoImage, type EnsoTone } from './EnsoImage';

type EnsoDividerProps = {
  tone?: EnsoTone;
};

export function EnsoDivider({ tone = 'blue' }: EnsoDividerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <EnsoImage tone={tone} size={18} opacity={tone === 'gray' ? 0.38 : tone === 'shu' ? 0.9 : 1} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 18,
  },
});
