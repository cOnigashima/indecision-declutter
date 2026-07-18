import { Settings } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '../theme/tokens';

type AppHeaderProps = {
  onSettingsPress?: () => void;
};

export function AppHeader({ onSettingsPress }: AppHeaderProps) {
  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
      return;
    }

    Alert.alert('設定', '設定項目は、これから追加予定です。');
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>不断捨離</Text>
      <Pressable
        accessibilityHint="現在は準備中です"
        accessibilityLabel="設定"
        accessibilityRole="button"
        hitSlop={4}
        onPress={handleSettingsPress}
        style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
      >
        <Settings color={colors.subtext} size={21} strokeWidth={2} />
      </Pressable>
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
  settingsButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingsButtonPressed: {
    opacity: 0.62,
    transform: [{ scale: 0.96 }],
  },
  title: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 33,
    letterSpacing: 1.5,
  },
});
