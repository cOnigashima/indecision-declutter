import { ChevronRight, Copy } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, shadows, urgency } from '../theme/tokens';
import type { UrgencyLevel } from '../types/item';
import { PhotoFrame } from './PhotoFrame';

type ItemListRowProps = {
  name: string;
  tag: string;
  dateLabel: string;
  urgencyLevel: UrgencyLevel;
  photoUri?: string;
  photoCount?: number;
  discarded?: boolean;
  onPress?: () => void;
};

export function ItemListRow({
  name,
  tag,
  dateLabel,
  urgencyLevel,
  photoUri,
  photoCount = 1,
  discarded = false,
  onPress,
}: ItemListRowProps) {
  const config = urgency[urgencyLevel];
  const Icon = config.icon;

  return (
    <Pressable
      accessibilityHint="詳細を開きます"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.photoWrap}>
        <PhotoFrame
          backgroundColor={discarded ? colors.washiShu : colors.washi}
          compact
          label={photoCount > 1 ? '表紙' : '写真'}
          style={styles.photo}
          uri={photoUri}
        />
        {photoCount > 1 ? (
          <View style={styles.countBadge}>
            <Copy color={colors.white} size={10} strokeWidth={2.2} />
            <Text style={styles.countText}>{photoCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>
            {name}
          </Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={styles.metaRow}>
          {discarded ? (
            <View style={styles.discardedBadge}>
              <Text style={styles.discardedText}>手放し済み</Text>
            </View>
          ) : (
            <View style={styles.urgencyBadge}>
              <Icon color={config.color} size={12} strokeWidth={2.2} />
              <Text style={[styles.urgencyText, { color: config.color }]}>{config.label}</Text>
            </View>
          )}
          <Text numberOfLines={1} style={[styles.tag, discarded && styles.discardedTag]}>
            {tag}
          </Text>
          <Text style={styles.photoCount}>写真{photoCount}枚</Text>
        </View>
      </View>

      <ChevronRight color={colors.subtextLight} size={18} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 3,
    left: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: 'absolute',
    top: 5,
  },
  countText: {
    color: colors.white,
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  date: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 12,
    marginLeft: 8,
  },
  discardedBadge: {
    backgroundColor: colors.shu,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discardedTag: {
    backgroundColor: colors.shuTint,
    color: colors.shu,
  },
  discardedText: {
    color: colors.washi,
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  name: {
    color: colors.sumi,
    flex: 1,
    fontFamily: fonts.serifSemiBold,
    fontSize: 15,
  },
  photo: {
    borderRadius: 9,
    height: 64,
    width: 64,
  },
  photoCount: {
    color: colors.subtextLight,
    fontFamily: fonts.mono,
    fontSize: 10,
    marginLeft: 'auto',
  },
  photoWrap: {
    height: 64,
    position: 'relative',
    width: 64,
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.99 }],
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 80,
    padding: 8,
    ...shadows.card,
  },
  tag: {
    backgroundColor: colors.washi,
    borderRadius: 4,
    color: colors.subtext,
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: 11,
    maxWidth: 90,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  urgencyBadge: {
    alignItems: 'center',
    backgroundColor: colors.washi,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  urgencyText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
});
