import { useNavigation } from '@react-navigation/native';
import { ScrollText } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { ItemCard } from '../components/ItemCard';
import { ItemListRow } from '../components/ItemListRow';
import { ListViewSwitch, type ListViewMode } from '../components/ListViewSwitch';
import { relativeDateLabel } from '../lib/dateLabels';
import { useItems } from '../state/ItemsContext';
import { colors, fonts } from '../theme/tokens';

export function DiscardedListScreen() {
  const navigation = useNavigation();
  const { discarded, error, loading } = useItems();
  const [viewMode, setViewMode] = useState<ListViewMode>('grid');

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
        {!loading && discarded.length > 0 ? (
          <View style={styles.viewControls}>
            <Text style={styles.resultCount}>{discarded.length}件</Text>
            <ListViewSwitch value={viewMode} onChange={setViewMode} tone="discarded" />
          </View>
        ) : null}
        <View style={viewMode === 'grid' ? styles.grid : styles.list}>
          {discarded.map((item) => {
            const sharedProps = {
              name: item.name,
              tag: '手放し済み',
              dateLabel: relativeDateLabel(item.releasedAt ?? item.updatedAt),
              urgencyLevel: item.urgency,
              photoUri: item.photos[item.coverIndex] ?? item.photos[0],
              photoCount: item.photos.length,
              discarded: true,
              onPress: () => navigation.navigate('DiscardedDetail', { itemId: item.id }),
            };

            return viewMode === 'grid' ? (
              <ItemCard key={item.id} {...sharedProps} />
            ) : (
              <ItemListRow key={item.id} {...sharedProps} />
            );
          })}
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
  list: {
    gap: 8,
  },
  resultCount: {
    color: colors.subtext,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
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
  viewControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
