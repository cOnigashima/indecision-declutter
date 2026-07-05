import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Archive, ArrowLeft, Edit3, Plus } from 'lucide-react-native';
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
import { PhotoFrame } from '../components/PhotoFrame';
import { monthDayLabel } from '../lib/dateLabels';
import { formatPriceDisplay } from '../lib/itemForm';
import { clampPhotoIndex as clampIndex } from '../lib/photoSelection';
import { captureAndStorePhoto } from '../lib/photoStorage';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import { useItemLoader } from '../state/useItemLoader';
import { colors, fonts, radii, urgency } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ navigation, route }: Props) {
  const { addPhoto } = useItems();
  const { item, loading, error: loadError } = useItemLoader(route.params.itemId);
  const [photoError, setPhotoError] = useState<string | null>(null);
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

  const handleAddPhoto = async () => {
    if (!item) {
      return;
    }

    const nextIndex = item.photos.length;
    setPhotoError(null);
    try {
      const uri = await captureAndStorePhoto();
      if (uri) {
        await addPhoto(item.id, uri);
        setActivePhotoIndex(nextIndex);
        requestAnimationFrame(() => {
          heroScrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        });
      }
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : '写真を追加できませんでした。');
    }
  };

  const moveToPhoto = (index: number) => {
    if (!item) {
      return;
    }

    const nextIndex = clampIndex(index, item.photos.length);
    setActivePhotoIndex(nextIndex);
    heroScrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  const handleHeroScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!item) {
      return;
    }

    const nextIndex = clampIndex(Math.round(event.nativeEvent.contentOffset.x / width), item.photos.length);
    setActivePhotoIndex((current) => (current === nextIndex ? current : nextIndex));
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

  const urgencyConfig = urgency[item.urgency];
  const memoryNote = item.memoryNote?.trim();
  const blockers = item.blockers.length > 0 ? item.blockers.join('、') : '-';

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <ScrollView
          ref={heroScrollRef}
          horizontal
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={handleHeroScroll}
          onScroll={handleHeroScroll}
          onScrollEndDrag={handleHeroScroll}
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={width}
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
        <Pressable onPress={handleAddPhoto} style={styles.addPhoto}>
          <Plus color={colors.sumi} size={14} />
          <Text style={styles.addPhotoText}>写真を足す</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        <View style={styles.nameBlock}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.urgencyDot, { backgroundColor: urgencyConfig.color }]} />
            <Text style={styles.meta}>
              {urgencyConfig.label} ・ 写真{item.photos.length}枚 ・ {monthDayLabel(item.createdAt)}
            </Text>
          </View>
        </View>
        <EnsoDivider />
        <View style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordLabel}>記録</Text>
            <Pressable onPress={() => navigation.navigate('ItemEdit', { itemId: item.id })} style={styles.editButton}>
              <Edit3 color={colors.kachi} size={18} strokeWidth={2.4} />
              <Text style={styles.editLink}>編集</Text>
            </Pressable>
          </View>
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
          {memoryNote ? (
            <Text style={styles.note}>「{memoryNote}」</Text>
          ) : (
            <Text style={[styles.note, styles.emptyNote]}>想いメモはまだありません。</Text>
          )}
        </View>
        <ActionButton
          label="手放す"
          tone="sumi"
          icon={Archive}
          onPress={() => navigation.navigate('ReleaseConfirm', { itemId: item.id })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.kachi,
  },
  addPhoto: {
    alignItems: 'center',
    backgroundColor: colors.translucentCard,
    borderRadius: radii.pill,
    bottom: 12,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    right: 12,
  },
  addPhotoText: {
    color: colors.sumi,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  body: {
    backgroundColor: colors.washi,
    flex: 1,
  },
  bodyContent: {
    padding: 22,
    paddingBottom: 34,
  },
  counter: {
    alignSelf: 'center',
    backgroundColor: colors.kachiOverlay,
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
  editLink: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(44,46,99,0.1)',
    borderColor: 'rgba(44,46,99,0.22)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  emptyBack: {
    borderColor: colors.border,
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
  errorText: {
    color: colors.dangerText,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
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
    flexDirection: 'row',
    left: 16,
    position: 'absolute',
    right: 16,
    top: 0,
  },
  inactiveDot: {
    backgroundColor: 'rgba(44,46,99,0.2)',
  },
  itemName: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 27,
    textAlign: 'center',
  },
  meta: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 15,
    textAlign: 'center',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  nameBlock: {
    alignItems: 'center',
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
  emptyNote: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
  },
  recordCard: {
    backgroundColor: colors.note,
    borderColor: colors.borderLight,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recordLabel: {
    color: colors.subtext,
    fontFamily: fonts.sansBold,
    fontSize: 15,
    letterSpacing: 0.7,
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
  urgencyDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
