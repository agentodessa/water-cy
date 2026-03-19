import { useColorScheme } from 'nativewind';
import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamCard } from '../../components/DamCard';
import { Shimmer } from '../../components/Shimmer';
import { SystemGauge } from '../../components/SystemGauge';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';

export default function HomeScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { data: percentages, isLoading: loadingPct, refetch: refetchPct } = usePercentages();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useDateStatistics();
  const isLoading = loadingPct || loadingStats;

  const damEntries = percentages
    ? Object.entries(percentages.damNamesToPercentage).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { refetchPct(); refetchStats(); }}
          tintColor="#0EA5E9"
        />
      }
    >
      <View
        className="flex-row items-center justify-between px-4 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Cyprus Water</Text>
        <TouchableOpacity
          onPress={() => setColorScheme(isDark ? 'light' : 'dark')}
          className="p-2"
        >
          <Text className="text-xl">{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <Shimmer height={240} borderRadius={20} style={{ margin: 16 }} />
        : percentages
          ? <SystemGauge
              percentage={percentages.totalPercentage}
              date={percentages.date}
              totalCapacityInMCM={percentages.totalCapacityInMCM}
            />
          : null}

      <Text className="text-base font-bold px-4 mt-5 mb-2.5 text-slate-900 dark:text-slate-100">All Reservoirs</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} width={110} height={90} borderRadius={20} style={{ marginRight: 10 }} />
            ))
          : damEntries.map(([name, pct]) => (
              <DamCard key={name} name={name} percentage={pct} />
            ))}
      </ScrollView>

      {stats && (
        <>
          <Text className="text-base font-bold px-4 mt-5 mb-2.5 text-slate-900 dark:text-slate-100">Today's Inflow (MCM)</Text>
          <View className="flex-row flex-wrap px-3 gap-2">
            {Object.entries(stats.inflowInMCM)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([name, inflow]) => (
                <View key={name} className="w-[30%] rounded-xl p-2.5 bg-white dark:bg-gray-900">
                  <Text className="text-[10px] font-semibold mb-0.5 text-slate-500 dark:text-slate-400" numberOfLines={1}>{name}</Text>
                  <Text className="text-sm font-bold text-sky-500">{inflow.toFixed(3)}</Text>
                </View>
              ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
