import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamRow } from '../../components/DamRow';
import { Shimmer } from '../../components/Shimmer';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { useTheme } from '../../theme/ThemeContext';

type SortKey = 'fill' | 'capacity' | 'name';

export default function DamsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>('fill');

  const { data: dams,        isLoading: l1, refetch: r1 } = useDams();
  const { data: percentages, isLoading: l2, refetch: r2 } = usePercentages();
  const { data: stats } = useDateStatistics();
  const isLoading = l1 || l2;

  const rows = dams && percentages
    ? [...dams]
        .map(dam => ({
          dam,
          pct:        percentages.damNamesToPercentage[dam.nameEn] ?? 0,
          storageMCM: stats?.storageInMCM[dam.nameEn] ?? 0,
        }))
        .sort((a, b) => {
          if (sort === 'fill')     return b.pct - a.pct;
          if (sort === 'capacity') return b.dam.capacity - a.dam.capacity;
          return a.dam.nameEn.localeCompare(b.dam.nameEn);
        })
    : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { r1(); r2(); }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Reservoirs</Text>
        <View style={styles.sortRow}>
          {(['fill', 'capacity', 'name'] as SortKey[]).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setSort(key)}
              style={[styles.chip, { backgroundColor: sort === key ? colors.accent : colors.surface }]}
            >
              <Text style={[styles.chipText, { color: sort === key ? '#fff' : colors.textSecondary }]}>
                {key === 'fill' ? 'Fill %' : key === 'capacity' ? 'Capacity' : 'Name'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} height={80} borderRadius={14} style={{ marginHorizontal: 16, marginBottom: 10 }} />
          ))
        : rows.map(({ dam, pct, storageMCM }) => (
            <DamRow
              key={dam.nameEn}
              name={dam.nameEn}
              percentage={pct}
              capacityMCM={dam.capacity / 1_000_000}
              storageMCM={storageMCM}
              onPress={() => router.push(`/dam/${dam.nameEn}`)}
            />
          ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { paddingHorizontal: 16, paddingBottom: 12 },
  title:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12 },
  sortRow:   { flexDirection: 'row', gap: 8 },
  chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText:  { fontSize: 12, fontWeight: '600' },
});
