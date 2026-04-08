import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { Shimmer } from '../../components/Shimmer';
import { useMonthlyInflows } from '../../hooks/useMonthlyInflows';

type Period = '1Y' | '3Y' | '5Y' | 'ALL';
const PERIOD_YEARS: Record<Period, number | null> = { '1Y': 1, '3Y': 3, '5Y': 5, 'ALL': null };
const YEAR_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function TrendsScreen() {
  const { colorScheme } = useColorScheme();
  const [period, setPeriod] = useState<Period>('5Y');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const { data: inflows, isLoading, refetch } = useMonthlyInflows();
  const currentYear = new Date().getFullYear();
  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = 200;

  const textSecondary = colorScheme === 'dark' ? '#94A3B8' : '#64748B';
  const axisStyle = {
    axis: { stroke: textSecondary },
    tickLabels: { fill: textSecondary, fontSize: 9 },
  };

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

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0EA5E9" />}
    >
      <View className="px-4 pt-3 pb-3">
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Historical Trends</Text>
      </View>

      <View className="flex-row gap-2 px-4 mb-4">
        {(['1Y', '3Y', '5Y', 'ALL'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            className={`px-3.5 py-[7px] rounded-full ${period === p ? 'bg-sky-500' : 'bg-white dark:bg-gray-900'}`}
          >
            <Text className={`text-[13px] font-semibold ${period === p ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-base font-bold px-4 mb-2.5 mt-2 text-slate-900 dark:text-slate-100">Monthly Inflows (MCM)</Text>
      {isLoading
        ? <Shimmer height={chartHeight} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View className="mx-4 rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-900">
            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis style={axisStyle} tickFormat={(t: number) => Math.round(t).toString()} />
              <VictoryAxis dependentAxis style={axisStyle} />
              <VictoryArea
                data={areaData}
                style={{ data: { fill: '#0EA5E933', stroke: '#0EA5E9', strokeWidth: 2 } }}
              />
            </VictoryChart>
          </View>
        )}

      <Text className="text-base font-bold px-4 mb-2.5 mt-2 text-slate-900 dark:text-slate-100">Year-over-Year</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 10 }}>
        {availableYears.map((year) => {
          const idx = selectedYears.indexOf(year);
          const isSelected = idx >= 0;
          return (
            <TouchableOpacity
              key={year}
              onPress={() => toggleYear(year)}
              className="px-3.5 py-[7px] rounded-full"
              style={{ backgroundColor: isSelected ? YEAR_COLORS[idx % YEAR_COLORS.length] : (colorScheme === 'dark' ? '#111827' : '#FFFFFF') }}
            >
              <Text className={`text-[13px] font-semibold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{year}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading
        ? <Shimmer height={chartHeight} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View className="mx-4 rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-900">
            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis style={axisStyle} tickFormat={(t: number) => MONTHS[t - 1] ?? String(t)} />
              <VictoryAxis dependentAxis style={axisStyle} />
              {yoyData.map(({ year, color, data }) => (
                <VictoryLine key={year} data={data} style={{ data: { stroke: color, strokeWidth: 2 } }} />
              ))}
            </VictoryChart>
          </View>
        )}
    </ScrollView>
  );
}
