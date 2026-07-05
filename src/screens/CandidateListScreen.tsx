import { useNavigation } from '@react-navigation/native';
import { Flame, HelpCircle, Package, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ItemCard } from '../components/ItemCard';
import { relativeDateLabel } from '../lib/dateLabels';
import { filterCandidateItems, listCandidateBlockers } from '../lib/itemFilters';
import { useItems } from '../state/ItemsContext';
import { colors, fonts } from '../theme/tokens';
import type { UrgencyLevel } from '../types/item';

const filterChips: { label: string; urgency?: UrgencyLevel; icon?: typeof Flame }[] = [
  { label: '全部' },
  { label: '今すぐ', urgency: 3, icon: Flame },
  { label: '捨てたい', urgency: 2, icon: Trash2 },
  { label: '迷い', urgency: 1, icon: HelpCircle },
  { label: '残す', urgency: 0, icon: Package },
];

export function CandidateListScreen() {
  const navigation = useNavigation();
  const { candidates, error, loading } = useItems();
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const blockerTags = useMemo(() => listCandidateBlockers(candidates), [candidates]);
  const filteredCandidates = useMemo(
    () => filterCandidateItems(candidates, { urgency: selectedUrgency, blocker: selectedTag }),
    [candidates, selectedTag, selectedUrgency]
  );
  const hasFilters = selectedUrgency !== undefined || selectedTag !== undefined;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {filterChips.map((chip) => {
            const Icon = chip.icon;
            const selected =
              chip.urgency === undefined ? selectedUrgency === undefined && selectedTag === undefined : selectedUrgency === chip.urgency;
            return (
              <Pressable
                key={chip.label}
                onPress={() => {
                  if (chip.urgency === undefined) {
                    setSelectedUrgency(undefined);
                    setSelectedTag(undefined);
                    return;
                  }

                  setSelectedUrgency((current) => (current === chip.urgency ? undefined : chip.urgency));
                }}
                style={[styles.filterChip, selected && styles.activeChip]}
              >
                {Icon ? <Icon color={selected ? colors.card : colors.subtext} size={selected ? 21 : 19} strokeWidth={2.25} /> : null}
                <Text style={[styles.filterText, selected && styles.activeFilterText]}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
          {blockerTags.map((tag) => {
            const selected = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag((current) => (current === tag ? undefined : tag))}
                style={[styles.tagChip, selected && styles.activeTagChip]}
              >
                <Text style={[styles.tagText, selected && styles.activeTagText]}>#{tag}</Text>
              </Pressable>
            );
          })}
          {blockerTags.length === 0 ? (
            <Pressable disabled style={styles.tagChip}>
              <Text style={styles.tagText}>#タグなし</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {loading ? <Text style={styles.stateText}>読み込み中</Text> : null}
        {error ? <Text style={styles.stateText}>記録を読み込めませんでした</Text> : null}
        {!loading && candidates.length === 0 ? <EmptyState /> : null}
        {!loading && candidates.length > 0 && filteredCandidates.length === 0 ? (
          <Text style={styles.stateText}>{hasFilters ? 'この条件の候補はありません' : '候補はありません'}</Text>
        ) : null}
        <View style={styles.grid}>
          {filteredCandidates.map((item) => (
            <ItemCard
              key={item.id}
              name={item.name}
              tag={item.blockers[0] ?? '迷い'}
              dateLabel={relativeDateLabel(item.updatedAt)}
              urgencyLevel={item.urgency}
              photoUri={item.photos[item.coverIndex] ?? item.photos[0]}
              photoCount={item.photos.length}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeChip: {
    backgroundColor: colors.kachi,
  },
  activeFilterText: {
    color: colors.card,
    fontFamily: fonts.sansBold,
  },
  activeTagChip: {
    backgroundColor: colors.card,
    borderColor: colors.kachi,
  },
  activeTagText: {
    color: colors.kachi,
    fontFamily: fonts.sansSemiBold,
  },
  content: {
    paddingBottom: 104,
    paddingHorizontal: 16,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 6,
    marginRight: 9,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  filterRow: {
    flexGrow: 0,
    marginTop: 8,
  },
  filterText: {
    color: colors.subtext,
    fontFamily: fonts.sansMedium,
    fontSize: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    rowGap: 12,
  },
  safe: {
    backgroundColor: colors.washi,
    flex: 1,
  },
  stateText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  tagChip: {
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  tagRow: {
    flexGrow: 0,
    marginTop: 12,
  },
  tagText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
});
