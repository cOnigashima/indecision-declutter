import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageIcon, MoreHorizontal, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoFrame } from '../components/PhotoFrame';
import { clampPhotoIndex as clampIndex } from '../lib/photoSelection';
import type { RootStackParamList } from '../navigation/types';
import { useItemLoader } from '../state/useItemLoader';
import { usePhotoActions } from '../state/usePhotoActions';
import { colors, fonts, radii } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoViewer'>;

export function PhotoViewerScreen({ navigation, route }: Props) {
  const { item, loading } = useItemLoader(route.params.itemId);
  const { removePhoto, setCover } = usePhotoActions(route.params.itemId);
  const { height, width } = useWindowDimensions();
  const viewerHeight = Math.max(420, height - 158);
  const viewerRef = useRef<ScrollView>(null);
  const photos = item?.photos ?? [];
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(route.params.index, photos.length));
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const appliedInitialIndex = useRef(false);
  const current = Math.min(currentIndex + 1, photos.length);

  useEffect(() => {
    appliedInitialIndex.current = false;
  }, [route.params.index, route.params.itemId]);

  useEffect(() => {
    // Apply the requested index once photos exist; photo removal must not
    // snap the viewer back to the index the screen was opened with.
    if (appliedInitialIndex.current || photos.length === 0) {
      return;
    }
    appliedInitialIndex.current = true;
    const nextIndex = clampIndex(route.params.index, photos.length);
    setCurrentIndex(nextIndex);
    requestAnimationFrame(() => {
      viewerRef.current?.scrollTo({ x: nextIndex * width, animated: false });
    });
  }, [photos.length, route.params.index, width]);

  const moveToIndex = (index: number) => {
    const nextIndex = clampIndex(index, photos.length);
    setCurrentIndex(nextIndex);
    viewerRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = clampIndex(Math.round(event.nativeEvent.contentOffset.x / width), photos.length);
    setCurrentIndex((currentValue) => (currentValue === nextIndex ? currentValue : nextIndex));
  };

  const handleSetCover = async () => {
    if (busy) {
      return;
    }
    setMenuOpen(false);
    setBusy(true);
    setActionError(null);
    setActionNotice(null);
    try {
      await setCover(currentIndex);
      setActionNotice('表紙にしました');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : '表紙を設定できませんでした。');
    } finally {
      setBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (busy) {
      return;
    }
    setMenuOpen(false);
    setActionError(null);
    setActionNotice(null);
    if (photos.length <= 1) {
      setActionError('写真は1枚以上必要です。');
      return;
    }

    setBusy(true);
    try {
      const result = await removePhoto(currentIndex);
      const nextIndex = clampIndex(currentIndex, result.photos.length);
      setCurrentIndex(nextIndex);
      requestAnimationFrame(() => {
        viewerRef.current?.scrollTo({ x: nextIndex * width, animated: false });
      });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : '写真を削除できませんでした。');
    } finally {
      setBusy(false);
    }
  };

  if (photos.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <X color={colors.white} size={24} />
          </Pressable>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyText}>{loading ? '読み込み中…' : '写真が見つかりません'}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.emptyBack}>
            <Text style={styles.emptyBackText}>戻る</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <X color={colors.white} size={24} />
        </Pressable>
        <Text style={styles.counter}>
          {current} / {photos.length}
        </Text>
        <Pressable onPress={() => setMenuOpen((open) => !open)} style={styles.iconButton}>
          <MoreHorizontal color={colors.white} size={24} />
        </Pressable>
      </View>

      {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
      {actionNotice ? <Text style={styles.actionNotice}>{actionNotice}</Text> : null}

      <View style={styles.viewer}>
        <ScrollView
          ref={viewerRef}
          horizontal
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={handleScroll}
          onScroll={handleScroll}
          onScrollEndDrag={handleScroll}
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={width}
        >
          {photos.map((photo, index) => (
            <View key={`${photo}-${index}`} style={[styles.photoPage, { height: viewerHeight, width }]}>
              <PhotoFrame
                uri={photo}
                label={`写真 ${index + 1}`}
                style={styles.mainPhotoImage}
                contentFit="contain"
                backgroundColor={colors.viewer}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbScroller}
        contentContainerStyle={styles.thumbRow}
      >
        {photos.map((photo, index) => (
          <Pressable key={`${photo}-thumb-${index}`} onPress={() => moveToIndex(index)} style={[styles.thumb, index === currentIndex && styles.activeThumb]}>
            <PhotoFrame uri={photo} label="" style={styles.thumbImage} backgroundColor={colors.photoDark} />
          </Pressable>
        ))}
      </ScrollView>

      {menuOpen ? (
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuCard}>
            <Pressable disabled={busy} onPress={() => void handleSetCover()} style={styles.menuItem}>
              <ImageIcon color={colors.white} size={18} />
              <Text style={styles.menuLabel}>表紙にする</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable disabled={busy} onPress={() => void handleRemovePhoto()} style={styles.menuItem}>
              <Trash2 color="#e08a80" size={18} />
              <Text style={[styles.menuLabel, styles.menuDangerLabel]}>写真を削除</Text>
            </Pressable>
          </View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionError: {
    color: '#e08a80',
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  actionNotice: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  activeThumb: {
    borderColor: colors.white,
    borderWidth: 2,
  },
  counter: {
    color: colors.white,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  emptyBack: {
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyBackText: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  emptyBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    zIndex: 2,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  mainPhotoImage: {
    height: '100%',
    width: '100%',
  },
  menuBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  menuCard: {
    backgroundColor: '#242428',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    position: 'absolute',
    right: 14,
    top: 74,
    width: 200,
  },
  menuDangerLabel: {
    color: '#e08a80',
  },
  menuDivider: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 1,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    color: colors.white,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
  photoPage: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  screen: {
    backgroundColor: colors.viewer,
    flex: 1,
  },
  thumb: {
    borderColor: 'transparent',
    borderRadius: 8,
    height: 42,
    overflow: 'hidden',
    width: 42,
  },
  thumbImage: {
    height: 42,
    width: 42,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minWidth: '100%',
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 18,
  },
  thumbScroller: {
    flexGrow: 0,
    height: 90,
  },
  viewer: {
    flex: 1,
  },
});
