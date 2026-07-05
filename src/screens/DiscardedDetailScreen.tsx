import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { EnsoDivider } from '../components/EnsoDivider';
import { EnsoImage } from '../components/EnsoImage';
import { PhotoFrame } from '../components/PhotoFrame';
import { daysBetweenLabel, monthDayLabel } from '../lib/dateLabels';
import { formatPriceDisplay } from '../lib/itemForm';
import { clampPhotoIndex as clampIndex } from '../lib/photoSelection';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import { useItemLoader } from '../state/useItemLoader';
import { colors, fonts, radii } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'DiscardedDetail'>;

export function DiscardedDetailScreen({ navigation, route }: Props) {
  const { restoreExistingItem } = useItems();
  const { item, loading, error: loadError } = useItemLoader(route.params.itemId);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!item) {
      return;
    }

    const nextIndex = clampIndex(item.coverIndex, item.photos.length);
    setActivePhotoIndex(nextIndex);
    requestAnimationFrame(() => {
      heroScrollRef.current?.scrollTo({ x: nextIndex * width, animated: false });
    });
  }, [item?.coverIndex, item?.id, item?.photos.length, width]);

  const handleRestore = async () => {
    if (!item) {
      return;
    }

    await restoreExistingItem(item.id);
    navigation.navigate('Tabs', { screen: 'CandidateList' });
  };

  const handleHeroScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!item) {
      return;
    }

    const nextIndex = clampIndex(Math.round(event.nativeEvent.contentOffset.x / width), item.photos.length);
    setActivePhotoIndex(nextIndex);
  };

  const moveToPhoto = (index: number) => {
    if (!item) {
      return;
    }

    const nextIndex = clampIndex(index, item.photos.length);
    setActivePhotoIndex(nextIndex);
    heroScrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.emptyScreen}>
        <Text style={styles.emptyText}>
          {loading ? '読み込み中…' : loadError ? '記録を読み込めませんでした。' : '記録が見つかりません'}
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.emptyBack}>
          <Text style={styles.emptyBackText}>戻る</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const blockers = item.blockers.length > 0 ? item.blockers.join('、') : '-';

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <ScrollView
          ref={heroScrollRef}
          horizontal
          onMomentumScrollEnd={handleHeroScrollEnd}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.heroScroller}
        >
          {item.photos.map((photo, index) => (
            <Pressable
              key={`${photo}-${index}`}
              onPress={() => navigation.navigate('PhotoViewer', { itemId: item.id, index })}
              style={[styles.heroPage, { width }]}
            >
              <PhotoFrame
                uri={photo}
                label={`写真 ${index + 1}`}
                style={styles.heroPhoto}
                contentFit="contain"
                backgroundColor={colors.washi}
              />
            </Pressable>
          ))}
        </ScrollView>
        <SafeAreaView edges={['top']} style={styles.heroControls}>
          <Pressable onPress={() => navigation.goBack()} style={styles.roundButton}>
            <ArrowLeft color={colors.sumi} size={22} />
          </Pressable>
        </SafeAreaView>
        <Pressable style={styles.counter} onPress={() => navigation.navigate('PhotoViewer', { itemId: item.id, index: activePhotoIndex })}>
          <Text style={styles.counterText}>{activePhotoIndex + 1} / {item.photos.length}</Text>
        </Pressable>
        <View style={styles.dots}>
          {item.photos.map((photo, index) => (
            <Pressable
              key={`${photo}-dot-${index}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => moveToPhoto(index)}
              style={[styles.dot, index === activePhotoIndex ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
        <View style={styles.discardedBadge}>
          <Text style={styles.discardedBadgeText}>手放し済み</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.releasedRow}>
          <EnsoImage tone="shu" size={22} opacity={0.9} />
          <Text style={styles.meta}>
            {monthDayLabel(item.releasedAt)}に手放しました ・ {daysBetweenLabel(item.createdAt, item.releasedAt)}そばに
          </Text>
        </View>
        <EnsoDivider tone="shu" />
        <View style={styles.recordCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>購入価格</Text>
            <Text style={styles.rowValue}>{formatPriceDisplay(item.price)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>最後に使った</Text>
            <Text style={styles.rowValue}>{item.lastUsedAt ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>保管場所</Text>
            <Text style={styles.rowValue}>{item.location ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>迷った理由</Text>
            <Text style={styles.rowValue}>{blockers}</Text>
          </View>
          <Text style={styles.note}>{item.memoryNote ?? '記録はまだありません。'}</Text>
        </View>
        <ActionButton label="やっぱり候補に戻す" tone="outline" icon={RotateCcw} onPress={() => void handleRestore()} />
        <Text style={styles.caption}>手放したことにしたけれど、まだ手元にある時に</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.shu,
  },
  body: {
    backgroundColor: colors.washi,
    flex: 1,
  },
  bodyContent: {
    padding: 22,
    paddingBottom: 34,
  },
  caption: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  counter: {
    alignSelf: 'center',
    backgroundColor: colors.shuOverlay,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    position: 'absolute',
    top: 48,
  },
  counterText: {
    color: colors.white,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  discardedBadge: {
    backgroundColor: colors.shu,
    borderRadius: radii.pill,
    bottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    right: 16,
  },
  discardedBadgeText: {
    color: colors.washi,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dots: {
    alignSelf: 'center',
    bottom: 14,
    flexDirection: 'row',
    gap: 7,
    position: 'absolute',
  },
  emptyBack: {
    borderColor: colors.borderLight,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyBackText: {
    color: colors.subtextDark,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  emptyScreen: {
    alignItems: 'center',
    backgroundColor: colors.washi,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  hero: {
    backgroundColor: colors.washi,
    height: 340,
    position: 'relative',
  },
  heroPage: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  heroPhoto: {
    height: '100%',
    width: '100%',
  },
  heroScroller: {
    flex: 1,
  },
  heroControls: {
    left: 16,
    position: 'absolute',
    right: 16,
    top: 0,
  },
  inactiveDot: {
    backgroundColor: 'rgba(146,56,46,0.24)',
  },
  itemName: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 27,
    textAlign: 'center',
  },
  meta: {
    color: colors.shu,
    fontFamily: fonts.serifSemiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  releasedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  note: {
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    color: colors.subtextDark,
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
  },
  recordCard: {
    backgroundColor: colors.note,
    borderColor: colors.borderLight,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  rowLabel: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  rowValue: {
    color: '#3a3833',
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  screen: {
    backgroundColor: colors.washi,
    flex: 1,
  },
});
