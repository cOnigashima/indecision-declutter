import { Grid2X2, List } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '../theme/tokens';

export type ListViewMode = 'grid' | 'list';

type ListViewSwitchProps = {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
  tone?: 'candidate' | 'discarded';
};

const options = [
  { value: 'grid', label: 'カード', icon: Grid2X2 },
  { value: 'list', label: 'リスト', icon: List },
] satisfies { value: ListViewMode; label: string; icon: typeof Grid2X2 }[];

export function ListViewSwitch({ value, onChange, tone = 'candidate' }: ListViewSwitchProps) {
  const activeColor = tone === 'discarded' ? colors.shu : colors.kachi;

  return (
    <View accessibilityLabel="一覧の表示形式" style={styles.switch}>
      {options.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;

        return (
          <Pressable
            accessibilityLabel={`${option.label}表示`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            hitSlop={4}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && { backgroundColor: activeColor }]}
          >
            <Icon color={selected ? colors.card : colors.subtext} size={15} strokeWidth={2.2} />
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  selectedLabel: {
    color: colors.card,
    fontFamily: fonts.sansBold,
  },
  switch: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 2,
  },
});
