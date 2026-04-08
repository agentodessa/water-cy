import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DamCard } from '../../components/DamCard';
import { Shimmer } from '../../components/Shimmer';
import { SystemGauge } from '../../components/SystemGauge';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';

const REFRESH_COOLDOWN_MS = 15_000;

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const translateX = useSharedValue(isDark ? 24 : 0);
  const rotate = useSharedValue(isDark ? 180 : 0);

  useEffect(() => {
    translateX.value = withTiming(isDark ? 24 : 0, { duration: 350, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    rotate.value = withTiming(isDark ? 180 : 0, { duration: 350, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [isDark, translateX, rotate]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
      <View
        className="w-[56px] h-[32px] rounded-full flex-row items-center px-[3px]"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#BFDBFE',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <Animated.View
          style={[thumbStyle, {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: isDark ? '#0F172A' : '#FBBF24',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: isDark ? '#0EA5E9' : '#F59E0B',
            shadowOpacity: isDark ? 0.5 : 0.4,
            shadowRadius: isDark ? 8 : 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }]}
        >
          <Text style={{ fontSize: 14 }}>{isDark ? '🌙' : '☀️'}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: percentages, isLoading: loadingPct, refetch: refetchPct } = usePercentages();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useDateStatistics();
  const isLoading = loadingPct || loadingStats;

  const lastRefreshAt = useRef(0);
  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAt.current = now;
    refetchPct();
    refetchStats();
  }, [refetchPct, refetchStats]);

  const damEntries = percentages
    ? Object.entries(percentages.damNamesToPercentage).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor="#0EA5E9"
        />
      }
    >
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Cyprus Water</Text>
        <ThemeToggle isDark={isDark} onToggle={() => setColorScheme(isDark ? 'light' : 'dark')} />
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
