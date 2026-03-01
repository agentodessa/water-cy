import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamCard } from '../../components/DamCard';
import { Shimmer } from '../../components/Shimmer';
import { SystemGauge } from '../../components/SystemGauge';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { useTheme } from '../../theme/ThemeContext';

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: percentages, isLoading: loadingPct, refetch: refetchPct } = usePercentages();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useDateStatistics();
  const isLoading = loadingPct || loadingStats;

  const damEntries = percentages
    ? Object.entries(percentages.damNamesToPercentage).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { refetchPct(); refetchStats(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Cyprus Water</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Gauge */}
      {isLoading
        ? <Shimmer height={240} borderRadius={20} style={{ margin: 16 }} />
        : percentages
          ? <SystemGauge
              percentage={percentages.totalPercentage}
              date={percentages.date}
              totalCapacityInMCM={percentages.totalCapacityInMCM}
            />
          : null}

      {/* All Reservoirs strip */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>All Reservoirs</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} width={110} height={90} borderRadius={20} style={{ marginRight: 10 }} />
            ))
          : damEntries.map(([name, pct]) => (
              <DamCard key={name} name={name} percentage={pct} />
            ))}
      </ScrollView>

      {/* Today's Inflow grid */}
      {stats && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Inflow (MCM)</Text>
          <View style={styles.inflowGrid}>
            {Object.entries(stats.inflowInMCM)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([name, inflow]) => (
                <View key={name} style={[styles.inflowItem, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.inflowName, { color: colors.textSecondary }]} numberOfLines={1}>{name}</Text>
                  <Text style={[styles.inflowValue, { color: colors.accent }]}>{inflow.toFixed(3)}</Text>
                </View>
              ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  title:        { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  themeBtn:     { padding: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  strip:        { paddingHorizontal: 16, paddingBottom: 4 },
  inflowGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  inflowItem:   { width: '30%', borderRadius: 12, padding: 10 },
  inflowName:   { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  inflowValue:  { fontSize: 14, fontWeight: '700' },
});
