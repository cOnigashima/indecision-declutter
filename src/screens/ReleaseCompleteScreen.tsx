import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { EnsoMark } from '../components/EnsoMark';
import { PhotoFrame } from '../components/PhotoFrame';
import type { RootStackParamList } from '../navigation/types';
import { useItemLoader } from '../state/useItemLoader';
import { colors, fonts } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ReleaseComplete'>;

export function ReleaseCompleteScreen({ navigation, route }: Props) {
  const { item } = useItemLoader(route.params.itemId);
  const { height, width } = useWindowDimensions();
  const ensoSize = Math.min(width * 1.02, height * 0.58);
  const photoSize = Math.max(160, Math.min(width * 0.74, ensoSize * 0.72) - 30);
  const ensoDrawScale = 1.04;

  return (
    <View style={styles.screen}>
      <View style={[styles.mainContent, { paddingBottom: Math.max(124, height * 0.16) }]}>
        <View style={[styles.ensoWrap, { height: ensoSize, width: ensoSize }]}>
          <View style={[styles.photoInside, { borderRadius: photoSize / 2, height: photoSize, width: photoSize }]}>
            <PhotoFrame uri={item?.photos[item.coverIndex] ?? item?.photos[0]} label="写真" contentFit="cover" />
          </View>
          <View pointerEvents="none" style={[styles.enso, { height: ensoSize, transform: [{ scale: ensoDrawScale }], width: ensoSize }]}>
            <EnsoMark tone="shu" size={ensoSize} animated />
          </View>
        </View>
        <Text style={styles.title}>円が、ひとつ結ばれました</Text>
        <Text style={styles.body}>
          {item?.name ?? 'このモノ'} を手放しました。{'\n'}
          記録は「捨離」に残ります。
        </Text>
      </View>
      <View style={styles.actions}>
        <Text style={styles.caption}>— 捨離リストへ移りました —</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace('Tabs', { screen: 'DiscardedList' })}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>捨離リストを見る</Text>
          <ArrowRight color={colors.washi} size={17} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace('Tabs', { screen: 'CandidateList' })}
          style={styles.candidateButton}
        >
          <Text style={styles.candidateText}>縁側へ戻る</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    bottom: 26,
    gap: 12,
    left: 24,
    position: 'absolute',
    right: 24,
  },
  body: {
    color: '#7a5348',
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 260,
    textAlign: 'center',
  },
  candidateButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: colors.shuTintStrong,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  candidateText: {
    color: colors.shu,
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
  caption: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginBottom: 4,
    textAlign: 'center',
  },
  enso: {
    position: 'absolute',
    zIndex: 2,
  },
  ensoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    overflow: 'visible',
  },
  mainContent: {
    alignItems: 'center',
    transform: [{ translateY: -44 }],
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: colors.shu,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nextText: {
    color: colors.washi,
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
  photoInside: {
    backgroundColor: colors.photoLight,
    overflow: 'hidden',
    zIndex: 1,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: colors.washiSheet,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: colors.shu,
    fontFamily: fonts.serifBold,
    fontSize: 25,
    lineHeight: 34,
    textAlign: 'center',
  },
});
