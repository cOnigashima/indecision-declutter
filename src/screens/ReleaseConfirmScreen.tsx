import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Archive, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { EnsoImage } from '../components/EnsoImage';
import { PhotoFrame } from '../components/PhotoFrame';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import { useItemLoader } from '../state/useItemLoader';
import { colors, fonts, radii } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ReleaseConfirm'>;

export function ReleaseConfirmScreen({ navigation, route }: Props) {
  const { releaseExistingItem } = useItems();
  const { item, loading } = useItemLoader(route.params.itemId);
  const { height, width } = useWindowDimensions();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photoSize = Math.min(width * 0.58, height * 0.34);
  const ensoSize = photoSize * 1.36;
  const ensoDrawScale = 1.04;

  const handleRelease = async () => {
    if (!item || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await releaseExistingItem(item.id);
      navigation.replace('ReleaseComplete', { itemId: item.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '手放しを記録できませんでした。');
    } finally {
      setSaving(false);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={() => navigation.goBack()} style={styles.close}>
          <X color={colors.subtext} size={24} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.body}>{loading ? '読み込み中…' : '記録が見つかりません。'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const coverPhoto = item.photos[item.coverIndex] ?? item.photos[0];

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable onPress={() => navigation.goBack()} style={styles.close}>
        <X color={colors.subtext} size={24} />
      </Pressable>

      <View style={styles.center}>
        <View style={[styles.ensoWrap, { height: ensoSize, width: ensoSize }]}>
          <View style={[styles.photoInside, { borderRadius: photoSize / 2, height: photoSize, width: photoSize }]}>
            <PhotoFrame uri={coverPhoto} label="写真" contentFit="contain" />
          </View>
          <View pointerEvents="none" style={[styles.grayEnso, { height: ensoSize, transform: [{ scale: ensoDrawScale }], width: ensoSize }]}>
            <EnsoImage tone="gray" size={ensoSize} opacity={0.48} />
          </View>
        </View>
        <Text style={styles.title}>{item.name} を手放しますか？</Text>
        <Text style={styles.body}>
          そっと、記憶へ移します。写真と記録は「捨離リスト」に残る。これは削除ではなく、変容です。
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.actions}>
        <ActionButton
          label="手放す（捨離リストへ）"
          tone="nibiiro"
          icon={Archive}
          onPress={() => void handleRelease()}
        />
        <Pressable onPress={() => navigation.goBack()} style={styles.keepButton}>
          <Text style={styles.keepText}>まだ、そばに置く</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 14,
    padding: 24,
  },
  body: {
    color: colors.subtextDark,
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 27,
    marginTop: 18,
    maxWidth: 288,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  close: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    top: 48,
    width: 40,
    zIndex: 2,
  },
  ensoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'visible',
  },
  grayEnso: {
    position: 'absolute',
    zIndex: 2,
  },
  errorText: {
    color: colors.dangerText,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginTop: 14,
    textAlign: 'center',
  },
  keepButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    padding: 14,
  },
  keepText: {
    color: colors.subtextDark,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  photoInside: {
    backgroundColor: colors.photoLight,
    overflow: 'hidden',
    zIndex: 1,
  },
  screen: {
    backgroundColor: colors.confirmSheet,
    flex: 1,
  },
  title: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 25,
    lineHeight: 34,
    textAlign: 'center',
  },
});
