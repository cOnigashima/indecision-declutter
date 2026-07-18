import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ItemCard } from '../components/ItemCard';
import { ItemListRow } from '../components/ItemListRow';
import { ListViewSwitch, type ListViewMode } from '../components/ListViewSwitch';
import { relativeDateLabel } from '../lib/dateLabels';
import { filterCandidateItems } from '../lib/itemFilters';
import { useItems } from '../state/ItemsContext';
import { colors, fonts, urgency } from '../theme/tokens';
import type { UrgencyLevel } from '../types/item';

const filterChips: { urgency?: UrgencyLevel }[] = [
  {},
  { urgency: 3 },
  { urgency: 2 },
  { urgency: 1 },
  { urgency: 0 },
];

export function CandidateListScreen() {
  const navigation = useNavigation();
  const { candidates, error, loading } = useItems();
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | undefined>();
  const [viewMode, setViewMode] = useState<ListViewMode>('grid');
  const filteredCandidates = useMemo(
    () => filterCandidateItems(candidates, { urgency: selectedUrgency }),
    [candidates, selectedUrgency]
  );
  const hasFilters = selectedUrgency !== undefined;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.content, !loading && candidates.length === 0 && styles.emptyContent]}
        showsVerticalScrollIndicator={false}
      >
        {candidates.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {filterChips.map((chip) => {
              const config = chip.urgency === undefined ? undefined : urgency[chip.urgency];
              const Icon = config?.icon;
              const label = config?.label ?? '全部';
              const selected =
                chip.urgency === undefined ? selectedUrgency === undefined : selectedUrgency === chip.urgency;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    if (chip.urgency === undefined) {
                      setSelectedUrgency(undefined);
                      return;
                    }

                    setSelectedUrgency((current) => (current === chip.urgency ? undefined : chip.urgency));
                  }}
                  style={[
                    styles.filterChip,
                    config
                      ? {
                          backgroundColor: selected ? config.filterBackground : colors.card,
                          borderColor: selected ? config.filterBorder : colors.borderLight,
                        }
                      : selected && styles.activeAllChip,
                  ]}
                >
                  {Icon && config ? (
                    <Icon color={config.color} size={selected ? 16 : 15} strokeWidth={2.25} />
                  ) : null}
                  <Text
                    style={[
                      styles.filterText,
                      config && { color: config.color },
                      selected && styles.selectedFilterText,
                      !config && selected && styles.activeAllFilterText,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {loading ? <Text style={styles.stateText}>読み込み中</Text> : null}
        {error ? <Text style={styles.stateText}>記録を読み込めませんでした</Text> : null}
        {!loading && candidates.length === 0 ? <EmptyState /> : null}
        {!loading && candidates.length > 0 && filteredCandidates.length === 0 ? (
          <Text style={styles.stateText}>
            {hasFilters ? 'この条件のモノはありません' : '縁側にはまだ、モノがありません'}
          </Text>
        ) : null}
        {!loading && candidates.length > 0 ? (
          <View style={styles.viewControls}>
            <Text style={styles.resultCount}>{filteredCandidates.length}件</Text>
            <ListViewSwitch value={viewMode} onChange={setViewMode} />
          </View>
        ) : null}
        <View style={viewMode === 'grid' ? styles.grid : styles.list}>
          {filteredCandidates.map((item) => {
            const sharedProps = {
              name: item.name,
              tag: item.blockers[0] ?? '迷い',
              dateLabel: relativeDateLabel(item.updatedAt),
              urgencyLevel: item.urgency,
              photoUri: item.photos[item.coverIndex] ?? item.photos[0],
              photoCount: item.photos.length,
              onPress: () => navigation.navigate('ItemDetail', { itemId: item.id }),
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
  activeAllChip: {
    backgroundColor: colors.kachi,
    borderColor: colors.kachi,
  },
  activeAllFilterText: {
    color: colors.card,
  },
  content: {
    paddingBottom: 104,
    paddingHorizontal: 16,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginRight: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterRow: {
    flexGrow: 0,
    marginTop: 4,
  },
  filterText: {
    color: colors.subtext,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
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
    backgroundColor: colors.washi,
    flex: 1,
  },
  selectedFilterText: {
    fontFamily: fonts.sansBold,
  },
  stateText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  viewControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 10,
  },
});
