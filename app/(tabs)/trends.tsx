import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { Shimmer } from '../../components/Shimmer';
import { useMonthlyInflows } from '../../hooks/useMonthlyInflows';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Period = '1Y' | '3Y' | '5Y' | 'ALL';
const PERIOD_YEARS: Record<Period, number | null> = { '1Y': 1, '3Y': 3, '5Y': 5, 'ALL': null };
const YEAR_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TrendsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('5Y');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const { data: inflows, isLoading, refetch } = useMonthlyInflows();
  const currentYear = new Date().getFullYear();
  const chartWidth = Dimensions.get('window').width - 64;
  const chartHeight = 200;

  const text = isDark ? '#F1F5F9' : '#0F172A';
  const meta = isDark ? '#94A3B8' : '#64748B';
  const dim = isDark ? '#64748B' : '#94A3B8';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';

  const axisStyle = {
    axis: { stroke: dim, strokeWidth: 0.5 },
    tickLabels: { fill: meta, fontSize: 9, fontWeight: 600 as any },
    grid: { stroke: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)', strokeWidth: 0.5 },
  };

  const filtered = useMemo(() => {
    if (!inflows) return [];
    const limit = PERIOD_YEARS[period];
    return limit ? inflows.filter(r => r.year >= currentYear - limit) : inflows;
  }, [inflows, period, currentYear]);

  const areaData = useMemo(() =>
    filtered.map(r => ({ x: r.year + (r.periodOrder - 1) / 12, y: r.inflowInMCM })),
  [filtered]);

  const summary = useMemo(() => {
    if (!filtered.length) return null;
    const total = filtered.reduce((s, r) => s + r.inflowInMCM, 0);
    const peak = filtered.reduce((p, r) => r.inflowInMCM > p.inflowInMCM ? r : p, filtered[0]);
    const dryMonths = filtered.filter(r => r.inflowInMCM < 0.5).length;
    const avgPerMonth = total / filtered.length;
    return { total, peak, dryMonths, avgPerMonth };
  }, [filtered]);

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

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0EA5E9" />}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: text }}>
          Historical Trends
        </Text>
        <Text style={{ fontSize: 13, marginTop: 2, color: meta }}>
          Monthly inflow data · 2009–present
        </Text>
      </View>

      <View className="px-4 pb-3">
        <SegmentedPeriod period={period} onChange={setPeriod} chipBg={chipBg} meta={meta} />
      </View>

      {isLoading ? (
        <Shimmer height={80} borderRadius={16} style={{ marginHorizontal: 16 }} />
      ) : summary ? (
        <SummaryCard
          totalMCM={summary.total}
          peakValue={summary.peak.inflowInMCM}
          peakLabel={`${MONTHS[summary.peak.periodOrder - 1]} ${summary.peak.year}`}
          avgMCM={summary.avgPerMonth}
          dryMonths={summary.dryMonths}
          cardBg={cardBg}
          cardBorder={cardBorder}
          meta={meta}
        />
      ) : null}

      <SectionHeader text="Monthly Inflows" unit="MCM" meta={meta} dim={dim} />
      {isLoading ? (
        <Shimmer height={chartHeight} borderRadius={20} style={{ marginHorizontal: 16 }} />
      ) : (
        <ChartCard cardBg={cardBg} cardBorder={cardBorder}>
          <VictoryChart
            width={chartWidth}
            height={chartHeight}
            theme={VictoryTheme.material}
            padding={{ top: 16, bottom: 34, left: 42, right: 12 }}
          >
            <VictoryAxis style={axisStyle} tickFormat={(t: number) => Math.round(t).toString()} />
            <VictoryAxis dependentAxis style={axisStyle} />
            <VictoryArea
              data={areaData}
              style={{ data: { fill: '#0EA5E933', stroke: '#0EA5E9', strokeWidth: 2 } }}
              interpolation="monotoneX"
              animate={{ duration: 500, easing: 'cubicInOut', onLoad: { duration: 600 } }}
            />
          </VictoryChart>
        </ChartCard>
      )}

      <SectionHeader text="Year-over-Year" unit="MCM per month" meta={meta} dim={dim} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
      >
        {availableYears.map((year) => {
          const idx = selectedYears.indexOf(year);
          const isSelected = idx >= 0;
          const color = isSelected ? YEAR_COLORS[idx % YEAR_COLORS.length] : undefined;
          return (
            <TouchableOpacity
              key={year}
              activeOpacity={0.7}
              onPress={() => toggleYear(year)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: isSelected ? color : chipBg,
              }}
            >
              {isSelected ? (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
              ) : null}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isSelected ? '#FFFFFF' : meta,
                }}
              >
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <Shimmer height={chartHeight} borderRadius={20} style={{ marginHorizontal: 16 }} />
      ) : (
        <ChartCard cardBg={cardBg} cardBorder={cardBorder}>
          <VictoryChart
            width={chartWidth}
            height={chartHeight}
            theme={VictoryTheme.material}
            padding={{ top: 16, bottom: 34, left: 42, right: 12 }}
          >
            <VictoryAxis
              style={axisStyle}
              tickValues={[1, 3, 5, 7, 9, 11]}
              tickFormat={(t: number) => MONTHS[t - 1] ?? ''}
            />
            <VictoryAxis dependentAxis style={axisStyle} />
            {yoyData.map(({ year, color, data }) => (
              <VictoryLine
                key={year}
                data={data}
                style={{ data: { stroke: color, strokeWidth: 2 } }}
                interpolation="monotoneX"
                animate={{ duration: 400, easing: 'cubicInOut', onLoad: { duration: 500 } }}
              />
            ))}
          </VictoryChart>
        </ChartCard>
      )}
    </ScrollView>
  );
}

interface SegmentedPeriodProps {
  period: Period;
  onChange: (p: Period) => void;
  chipBg: string;
  meta: string;
}

function SegmentedPeriod({ period, onChange, chipBg, meta }: SegmentedPeriodProps) {
  return (
    <View
      className="flex-row rounded-2xl p-1 self-start"
      style={{ backgroundColor: chipBg }}
    >
      {(['1Y', '3Y', '5Y', 'ALL'] as Period[]).map(p => {
        const active = period === p;
        return (
          <TouchableOpacity
            key={p}
            activeOpacity={0.7}
            onPress={() => onChange(p)}
            className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: active ? '#0EA5E9' : 'transparent' }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 0.3,
                color: active ? '#FFFFFF' : meta,
              }}
            >
              {p}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface SectionHeaderProps {
  text: string;
  unit: string;
  meta: string;
  dim: string;
}

function SectionHeader({ text, unit, meta, dim }: SectionHeaderProps) {
  return (
    <View className="flex-row items-end px-4 mt-3 mb-2" style={{ gap: 8 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: meta, letterSpacing: -0.2 }}>
        {text}
      </Text>
      <Text style={{ fontSize: 11, color: dim, fontWeight: '600', marginBottom: 1 }}>
        · {unit}
      </Text>
    </View>
  );
}

interface SummaryCardProps {
  totalMCM: number;
  peakValue: number;
  peakLabel: string;
  avgMCM: number;
  dryMonths: number;
  cardBg: string;
  cardBorder: string;
  meta: string;
}

function SummaryCard({
  totalMCM, peakValue, peakLabel, avgMCM, dryMonths,
  cardBg, cardBorder, meta,
}: SummaryCardProps) {
  return (
    <View
      className="mx-4"
      style={{
        backgroundColor: cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: cardBorder,
        paddingVertical: 12,
      }}
    >
      <View className="flex-row">
        <SummaryStat label="Total"  value={totalMCM}  fractionDigits={0} unit="MCM"       meta={meta} color="#0EA5E9" />
        <SummaryDivider border={cardBorder} />
        <SummaryStat label="Avg/mo" value={avgMCM}    fractionDigits={1} unit="MCM"       meta={meta} color="#10B981" />
        <SummaryDivider border={cardBorder} />
        <SummaryStat label="Peak"   value={peakValue} fractionDigits={1} unit={peakLabel} meta={meta} color="#F59E0B" />
        <SummaryDivider border={cardBorder} />
        <SummaryStat label="Dry mo" value={dryMonths} fractionDigits={0} unit="months"    meta={meta} color="#EF4444" />
      </View>
    </View>
  );
}

interface SummaryStatProps {
  label: string;
  value: number;
  fractionDigits: number;
  unit: string;
  color: string;
  meta: string;
}

function SummaryStat({ label, value, fractionDigits, unit, color, meta }: SummaryStatProps) {
  const shared = useSharedValue(value);
  useEffect(() => {
    shared.value = withTiming(value, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [value, shared]);

  const animatedProps = useAnimatedProps(() => ({
    text: shared.value.toFixed(fractionDigits),
    defaultValue: value.toFixed(fractionDigits),
  }));

  return (
    <View className="flex-1 items-center" style={{ paddingHorizontal: 4 }}>
      <AnimatedTextInput
        editable={false}
        underlineColorAndroid="transparent"
        animatedProps={animatedProps}
        style={{
          fontSize: 18,
          fontWeight: '900',
          color,
          letterSpacing: -0.5,
          textAlign: 'center',
          padding: 0,
          minWidth: 50,
          backgroundColor: 'transparent',
        }}
      />
      <Text
        style={{
          fontSize: 8.5,
          fontWeight: '800',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: meta,
          marginTop: 4,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 9, color: meta, marginTop: 1 }} numberOfLines={1}>
        {unit}
      </Text>
    </View>
  );
}

function SummaryDivider({ border }: { border: string }) {
  return <View style={{ width: 1, marginVertical: 4, backgroundColor: border }} />;
}

function ChartCard({
  cardBg, cardBorder, children,
}: { cardBg: string; cardBorder: string; children: React.ReactNode }) {
  return (
    <View
      className="mx-4"
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: cardBorder,
        paddingVertical: 8,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}
