import { useNavigation } from '@react-navigation/native';
import { ScrollText } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { ItemCard } from '../components/ItemCard';
import { relativeDateLabel } from '../lib/dateLabels';
import { useItems } from '../state/ItemsContext';
import { colors, fonts } from '../theme/tokens';

export function DiscardedListScreen() {
  const navigation = useNavigation();
  const { discarded, error, loading } = useItems();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.discardedHeader}>
          <View style={styles.line} />
          <View style={styles.headerTextWrap}>
            <ScrollText color={colors.shu} size={16} />
            <Text style={styles.headerText}>手放した記録</Text>
          </View>
          <View style={styles.line} />
        </View>
        {loading ? <Text style={styles.stateText}>読み込み中</Text> : null}
        {error ? <Text style={styles.stateText}>記録を読み込めませんでした</Text> : null}
        {!loading && discarded.length === 0 ? <Text style={styles.stateText}>手放した記録はまだありません</Text> : null}
        <View style={styles.grid}>
          {discarded.map((item) => (
            <ItemCard
              key={item.id}
              name={item.name}
              tag="手放し済み"
              dateLabel={relativeDateLabel(item.releasedAt ?? item.updatedAt)}
              urgencyLevel={item.urgency}
              photoUri={item.photos[item.coverIndex] ?? item.photos[0]}
              photoCount={item.photos.length}
              discarded
              onPress={() => navigation.navigate('DiscardedDetail', { itemId: item.id })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 104,
    paddingHorizontal: 16,
  },
  discardedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 22,
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  headerText: {
    color: colors.subtext,
    fontFamily: fonts.serifMedium,
    fontSize: 17,
    letterSpacing: 1.4,
  },
  headerTextWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  line: {
    backgroundColor: colors.shuTintStrong,
    height: 1,
    width: 58,
  },
  safe: {
    backgroundColor: colors.washiShu,
    flex: 1,
  },
  stateText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
