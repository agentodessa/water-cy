import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DamRow } from '../../components/DamRow';
import { Shimmer } from '../../components/Shimmer';
import { SystemGauge } from '../../components/SystemGauge';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';

const REFRESH_COOLDOWN_MS = 15_000;
const HOME_DAM_COUNT = 5;
const HOME_INFLOW_COUNT = 6;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function sumStorage(storage?: Record<string, number>): number | undefined {
  if (!storage) return undefined;
  const values = Object.values(storage);
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0);
}

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
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dateSevenDaysAgo = useMemo(() => isoDaysAgo(7), []);

  const { data: percentages, isLoading: loadingPct,   refetch: refetchPct }   = usePercentages();
  const { data: stats,       isLoading: loadingStats, refetch: refetchStats } = useDateStatistics();
  const { data: pastStats }  = useDateStatistics(dateSevenDaysAgo);
  const { data: dams,        isLoading: loadingDams,  refetch: refetchDams }  = useDams();
  const isLoading = loadingPct || loadingStats || loadingDams;

  const lastRefreshAt = useRef(0);
  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAt.current = now;
    refetchPct();
    refetchStats();
    refetchDams();
  }, [refetchPct, refetchStats, refetchDams]);

  const delta7d = useMemo(() => {
    const now  = sumStorage(stats?.storageInMCM);
    const past = sumStorage(pastStats?.storageInMCM);
    if (now === undefined || past === undefined) return undefined;
    return now - past;
  }, [stats, pastStats]);

  const topDams = percentages && dams
    ? [...dams]
        .sort((a, b) => b.capacity - a.capacity)
        .slice(0, HOME_DAM_COUNT)
        .map(dam => {
          const name = dam.nameEn;
          const pct = percentages.damNamesToPercentage[name] ?? 0;
          const capacityMCM = dam.capacity / 1_000_000;
          const storageMCM  = stats?.storageInMCM[name] ?? capacityMCM * pct;
          return { name, pct, capacityMCM, storageMCM };
        })
    : [];

  const topInflows = stats
    ? Object.entries(stats.inflowInMCM)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, HOME_INFLOW_COUNT)
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

      {loadingPct
        ? <Shimmer height={320} borderRadius={20} style={{ margin: 16 }} />
        : percentages
          ? <SystemGauge
              percentage={percentages.totalPercentage}
              date={percentages.date}
              totalCapacityInMCM={percentages.totalCapacityInMCM}
              delta7dMCM={delta7d}
            />
          : null}

      <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-500">
          Reservoirs{dams ? ` · ${dams.length}` : ''}
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/dams')}>
          <Text className="text-[13px] font-semibold text-sky-500">See all</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? Array.from({ length: HOME_DAM_COUNT }).map((_, i) => (
            <Shimmer key={i} height={72} borderRadius={14} style={{ marginHorizontal: 16, marginBottom: 10 }} />
          ))
        : topDams.map(({ name, pct, capacityMCM, storageMCM }) => (
            <DamRow
              key={name}
              name={name}
              percentage={pct}
              capacityMCM={capacityMCM}
              storageMCM={storageMCM}
              onPress={() => router.push(`/dam/${name}`)}
            />
          ))}

      {topInflows.length > 0 && (
        <>
          <View className="px-5 pt-5 pb-2">
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-500">
              Today's Inflow
            </Text>
          </View>
          <View className="flex-row flex-wrap px-4 gap-2 pb-4">
            {topInflows.map(([name, inflow]) => (
              <View
                key={name}
                className="rounded-xl p-2.5 bg-white dark:bg-gray-900"
                style={{ width: '31.5%' }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <View className="flex-row items-baseline mt-1">
                  <Text className="text-[15px] font-extrabold text-sky-500" numberOfLines={1}>
                    {inflow.toFixed(3)}
                  </Text>
                  <Text className="text-[10px] font-bold text-slate-400 ml-1">MCM</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
