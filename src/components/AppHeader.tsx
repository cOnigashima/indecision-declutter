import { Moon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme/tokens';

export function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>不断捨離</Text>
      <Moon color={colors.subtextLight} size={22} strokeWidth={2.1} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 33,
    letterSpacing: 1.5,
  },
});
