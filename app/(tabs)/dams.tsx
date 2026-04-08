import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { DamRow } from '../../components/DamRow';
import { Shimmer } from '../../components/Shimmer';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';

type SortKey = 'fill' | 'capacity' | 'name';

export default function DamsScreen() {
  const { colorScheme } = useColorScheme();
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
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { r1(); r2(); }}
          tintColor="#0EA5E9"
        />
      }
    >
      <View className="px-4 pt-3 pb-3">
        <Text className="text-[22px] font-extrabold tracking-tight mb-3 text-slate-900 dark:text-slate-100">Reservoirs</Text>
        <View className="flex-row gap-2">
          {(['fill', 'capacity', 'name'] as SortKey[]).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setSort(key)}
              className={`px-3 py-1.5 rounded-full ${sort === key ? 'bg-sky-500' : 'bg-white dark:bg-gray-900'}`}
            >
              <Text className={`text-xs font-semibold ${sort === key ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
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
