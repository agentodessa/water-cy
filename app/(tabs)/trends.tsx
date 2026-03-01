import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { Shimmer } from '../../components/Shimmer';
import { useMonthlyInflows } from '../../hooks/useMonthlyInflows';
import { useTheme } from '../../theme/ThemeContext';

type Period = '1Y' | '3Y' | '5Y' | 'ALL';
const PERIOD_YEARS: Record<Period, number | null> = { '1Y': 1, '3Y': 3, '5Y': 5, 'ALL': null };
const YEAR_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function TrendsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('5Y');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const { data: inflows, isLoading, refetch } = useMonthlyInflows();
  const currentYear = new Date().getFullYear();
  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = 200;

  const filtered = useMemo(() => {
    if (!inflows) return [];
    const limit = PERIOD_YEARS[period];
    return limit ? inflows.filter(r => r.year >= currentYear - limit) : inflows;
  }, [inflows, period, currentYear]);

  const areaData = useMemo(() =>
    filtered.map(r => ({ x: r.year + (r.periodOrder - 1) / 12, y: r.inflowInMCM })),
  [filtered]);

  const availableYears = useMemo(() => {
    if (!inflows) return [];
    return [...new Set(inflows.map(r => r.year))].sort().reverse().slice(0, 10);
  }, [inflows]);

  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears(availableYears.slice(0, 3));
    }
  }, [availableYears, selectedYears.length]);

  const yoyData = useMemo(() => {
    if (!inflows) return [];
    return selectedYears.map((year, i) => ({
      year,
      color: YEAR_COLORS[i % YEAR_COLORS.length],
      data: inflows
        .filter(r => r.year === year)
        .sort((a, b) => a.periodOrder - b.periodOrder)
        .map(r => ({ x: r.periodOrder, y: r.inflowInMCM })),
    }));
  }, [inflows, selectedYears]);

  const toggleYear = (year: number) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].slice(-5)
  );

  const axisStyle = {
    axis: { stroke: colors.textSecondary },
    tickLabels: { fill: colors.textSecondary, fontSize: 9 },
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Historical Trends</Text>
      </View>

      {/* Period filter */}
      <View style={styles.filterRow}>
        {(['1Y', '3Y', '5Y', 'ALL'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.chip, { backgroundColor: period === p ? colors.accent : colors.surface }]}
          >
            <Text style={[styles.chipText, { color: period === p ? '#fff' : colors.textSecondary }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Monthly inflows area chart */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Inflows (MCM)</Text>
      {isLoading
        ? <Shimmer height={chartHeight} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis
                style={axisStyle}
                tickFormat={(t: number) => Math.round(t).toString()}
              />
              <VictoryAxis dependentAxis style={axisStyle} />
              <VictoryArea
                data={areaData}
                style={{ data: { fill: `${colors.accent}33`, stroke: colors.accent, strokeWidth: 2 } }}
              />
            </VictoryChart>
          </View>
        )}

      {/* Year-over-year chart */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Year-over-Year</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearChips}>
        {availableYears.map((year) => {
          const idx = selectedYears.indexOf(year);
          const isSelected = idx >= 0;
          return (
            <TouchableOpacity
              key={year}
              onPress={() => toggleYear(year)}
              style={[styles.chip, { backgroundColor: isSelected ? YEAR_COLORS[idx % YEAR_COLORS.length] : colors.surface }]}
            >
              <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>{year}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading
        ? <Shimmer height={chartHeight} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis
                style={axisStyle}
                tickFormat={(t: number) => MONTHS[t - 1] ?? String(t)}
              />
              <VictoryAxis dependentAxis style={axisStyle} />
              {yoyData.map(({ year, color, data }) => (
                <VictoryLine
                  key={year}
                  data={data}
                  style={{ data: { stroke: color, strokeWidth: 2 } }}
                />
              ))}
            </VictoryChart>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { paddingHorizontal: 16, paddingBottom: 12 },
  title:        { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  filterRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10, marginTop: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  chipText:     { fontSize: 13, fontWeight: '600' },
  chartCard:    { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  yearChips:    { paddingHorizontal: 16, gap: 8, marginBottom: 10 },
});
