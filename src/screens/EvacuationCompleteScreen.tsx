import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BouncyCheck } from '../components/BouncyCheck';
import { EnsoMark } from '../components/EnsoMark';
import { PhotoFrame } from '../components/PhotoFrame';
import { startOfLocalDayTimestamp } from '../lib/dateLabels';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import { useItemLoader } from '../state/useItemLoader';
import { colors, fonts } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EvacuationComplete'>;

export function EvacuationCompleteScreen({ navigation, route }: Props) {
  const { candidates, discarded, removeExistingItem } = useItems();
  const itemId = route.params?.itemId;
  const { item } = useItemLoader(itemId);
  const { height, width } = useWindowDimensions();
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  const ensoSize = Math.min(width * 1.02, height * 0.58);
  const photoSize = Math.max(160, Math.min(width * 0.74, ensoSize * 0.72) - 30);
  const ensoDrawScale = 1.04;
  const checkSize = Math.max(42, ensoSize * 0.15);
  const todayCount = useMemo(() => {
    const startOfToday = startOfLocalDayTimestamp();
    return [...candidates, ...discarded].filter((record) => record.createdAt >= startOfToday).length;
  }, [candidates, discarded]);

  const navigateAfterComplete = useCallback(() => {
    if (route.params?.returnTo === 'candidate') {
      navigation.replace('Tabs', { screen: 'CandidateList' });
    } else {
      navigation.replace('Capture');
    }
  }, [navigation, route.params?.returnTo]);

  const handleUndo = async () => {
    if (!itemId || undoing) {
      return;
    }

    setUndoing(true);
    setUndoError(null);
    try {
      await removeExistingItem(itemId);
      navigateAfterComplete();
    } catch (caught) {
      setUndoError(caught instanceof Error ? caught.message : '退避を取り消せませんでした。');
      setUndoing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.mainContent, { paddingBottom: Math.max(228, height * 0.26) }]}>
        <View style={[styles.ensoWrap, { height: ensoSize, width: ensoSize }]}>
          <View style={[styles.photoInside, { borderRadius: photoSize / 2, height: photoSize, width: photoSize }]}>
            <PhotoFrame uri={item?.photos[item.coverIndex] ?? item?.photos[0]} label="写真" contentFit="cover" />
          </View>
          <View pointerEvents="none" style={[styles.enso, { height: ensoSize, transform: [{ scale: ensoDrawScale }], width: ensoSize }]}>
            <EnsoMark tone="blue" size={ensoSize} animated durationMs={520} />
          </View>
          <BouncyCheck
            size={checkSize}
            style={{
              borderRadius: checkSize / 2,
              bottom: ensoSize * 0.1,
              right: ensoSize * 0.08,
              zIndex: 3,
            }}
          />
        </View>
        <Text style={styles.title}>退避しました</Text>
        <Text style={styles.count}>本日 {todayCount} つめ</Text>
        <Text style={styles.caption}>— 見届けたら、次へ —</Text>
        {undoError ? <Text style={styles.errorText}>{undoError}</Text> : null}
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => navigation.replace('Capture')} style={styles.nextButton}>
          <Text style={styles.nextText}>次を撮る</Text>
          <ArrowRight color={colors.washi} size={17} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace('Tabs', { screen: 'CandidateList' })}
          style={styles.candidateButton}
        >
          <Text style={styles.candidateText}>候補一覧へ戻る</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!itemId || undoing}
          onPress={() => void handleUndo()}
          style={[styles.snack, (!itemId || undoing) && styles.snackDisabled]}
        >
          <Text style={styles.snackText}>{undoing ? '取り消しています' : '退避を取り消す'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    bottom: 18,
    gap: 12,
    left: 22,
    position: 'absolute',
    right: 22,
  },
  caption: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginTop: 8,
  },
  candidateButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(44,46,99,0.2)',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  candidateText: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
  count: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: colors.dangerText,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginTop: 12,
    maxWidth: 260,
    textAlign: 'center',
  },
  enso: {
    position: 'absolute',
    zIndex: 2,
  },
  ensoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'visible',
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: colors.kachi,
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
    backgroundColor: '#eef0f5',
    flex: 1,
    justifyContent: 'center',
  },
  mainContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  snack: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  snackDisabled: {
    opacity: 0.7,
  },
  snackText: {
    color: colors.shu,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  title: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 25,
  },
});
