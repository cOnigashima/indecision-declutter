import { ChevronDown } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { EnsoImage } from './EnsoImage';
import { colors, fonts } from '../theme/tokens';

type EmptyStateProps = {
  title?: string;
  body?: string;
  hint?: string;
};

export function EmptyState({
  title = '捨てるか迷ったら、\n撮る。',
  body = '迷いは、捨てなくていい。\nひとまず、ここへ退避しましょう。',
  hint = '下の カメラ から',
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <EnsoImage tone="blue" size={180} opacity={0.28} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.hint}>
        <ChevronDown color={colors.subtextLight} size={16} />
        <Text style={styles.hintText}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.subtext,
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 27,
    marginTop: 16,
    textAlign: 'center',
  },
  hint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 26,
  },
  hintText: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  title: {
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 25,
    lineHeight: 35,
    marginTop: 14,
    textAlign: 'center',
  },
  wrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
});
