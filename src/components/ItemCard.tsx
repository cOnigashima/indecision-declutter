import { Copy } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, shadows, urgency } from '../theme/tokens';
import type { UrgencyLevel } from '../types/item';
import { PhotoFrame } from './PhotoFrame';

type ItemCardProps = {
  name: string;
  tag: string;
  dateLabel: string;
  urgencyLevel: UrgencyLevel;
  photoUri?: string;
  photoCount?: number;
  discarded?: boolean;
  onPress?: () => void;
};

export function ItemCard({
  name,
  tag,
  dateLabel,
  urgencyLevel,
  photoUri,
  photoCount = 1,
  discarded = false,
  onPress,
}: ItemCardProps) {
  const config = urgency[urgencyLevel];
  const Icon = config.icon;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        <PhotoFrame uri={photoUri} label={photoCount > 1 ? '表紙' : '写真'} backgroundColor={colors.washi} />
        {photoCount > 1 ? (
          <View style={styles.countBadge}>
            <Copy color="#fff" size={12} strokeWidth={2.2} />
            <Text style={styles.countText}>{photoCount}</Text>
          </View>
        ) : null}
        {discarded ? (
          <View style={styles.discardedBadge}>
            <Text style={styles.discardedText}>手放し済み</Text>
          </View>
        ) : (
          <View style={styles.urgencyBadge}>
            <Icon color={config.color} size={13} strokeWidth={2} />
            <Text style={[styles.urgencyText, { color: config.color }]}>{config.label}</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <View style={styles.bottomRow}>
          <Text numberOfLines={1} style={[styles.tag, discarded && styles.discardedTag]}>
            {tag}
          </Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    width: '48%',
    ...shadows.card,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 7,
    flexDirection: 'row',
    gap: 4,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    top: 8,
  },
  countText: {
    color: colors.white,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  date: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  discardedBadge: {
    backgroundColor: colors.shu,
    borderRadius: radii.pill,
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 8,
  },
  discardedText: {
    color: colors.washi,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  discardedTag: {
    backgroundColor: colors.shuTint,
    borderColor: colors.shuTintStrong,
    color: colors.shu,
  },
  meta: {
    gap: 5,
    padding: 8,
  },
  name: {
    color: colors.sumi,
    fontFamily: fonts.serifSemiBold,
    fontSize: 16,
  },
  photoWrap: {
    position: 'relative',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  tag: {
    backgroundColor: colors.washi,
    borderColor: colors.borderLight,
    borderRadius: 4,
    borderWidth: 1,
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 14,
    maxWidth: 86,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgencyBadge: {
    alignItems: 'center',
    backgroundColor: colors.translucentCard,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  urgencyText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
});
