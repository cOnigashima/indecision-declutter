import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Camera, Grid3X3, ScrollText } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, shadows } from '../theme/tokens';

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;
  const candidateActive = activeRoute === 'CandidateList';
  const discardedActive = activeRoute === 'DiscardedList';

  const goTab = (name: string) => {
    navigation.navigate(name);
  };

  // Per product-spec, the FAB opens the Capture screen; photography and
  // draft ownership start inside Capture, never out here.
  const goCapture = () => {
    navigation.getParent()?.navigate('Capture');
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 0) }]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityLabel="縁側、捨てるか残すかをまだ決めていないモノ"
          accessibilityRole="button"
          accessibilityState={{ selected: candidateActive }}
          onPress={() => goTab('CandidateList')}
          style={[styles.tab, candidateActive && styles.activeTab]}
        >
          <Grid3X3
            color={candidateActive ? colors.kachi : colors.subtext}
            size={candidateActive ? 34 : 29}
            strokeWidth={candidateActive ? 2.6 : 2.15}
          />
          <Text style={[styles.label, candidateActive && styles.activeLabel]}>縁側</Text>
        </Pressable>

        <Pressable accessibilityLabel="写真を撮って、写しを収める" accessibilityRole="button" onPress={goCapture} style={styles.fab}>
          <Camera color={colors.white} size={32} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: discardedActive }}
          onPress={() => goTab('DiscardedList')}
          style={[styles.tab, discardedActive && styles.activeTabShu]}
        >
          <ScrollText
            color={discardedActive ? colors.shu : colors.subtext}
            size={discardedActive ? 33 : 28}
            strokeWidth={discardedActive ? 2.6 : 2.15}
          />
          <Text style={[styles.label, discardedActive && styles.activeLabelShu]}>捨離</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeLabel: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
  activeLabelShu: {
    color: colors.shu,
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(44,46,99,0.08)',
    borderColor: 'rgba(44,46,99,0.14)',
    borderWidth: 1,
  },
  activeTabShu: {
    backgroundColor: colors.shuTint,
    borderColor: colors.shuTintStrong,
    borderWidth: 1,
  },
  bar: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 82,
    justifyContent: 'center',
    position: 'relative',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.kachi,
    borderColor: colors.washi,
    borderRadius: 35,
    borderWidth: 5,
    bottom: 34,
    height: 70,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -35,
    position: 'absolute',
    width: 70,
    ...shadows.fab,
  },
  label: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: 0.55,
  },
  tab: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 16,
    gap: 5,
    height: 62,
    justifyContent: 'center',
    marginHorizontal: 44,
    width: 82,
  },
  wrap: {
    backgroundColor: colors.card,
  },
});
