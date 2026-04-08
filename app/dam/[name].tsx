import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FillBar } from '../../components/FillBar';
import { GlassCard } from '../../components/GlassCard';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { formatMCM, formatPercentage } from '../../lib/format';
import { getFillClass } from '../../lib/utils';

export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const { data: dams }        = useDams();
  const { data: percentages } = usePercentages();
  const { data: stats }       = useDateStatistics();

  const dam        = dams?.find(d => d.nameEn === name);
  const pct        = percentages?.damNamesToPercentage[name ?? ''] ?? 0;
  const storageMCM = stats?.storageInMCM[name ?? ''] ?? 0;
  const inflowMCM  = stats?.inflowInMCM[name ?? ''] ?? 0;

  if (!dam) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F0F4F8] dark:bg-[#0A0F1E]">
        <Text className="text-slate-900 dark:text-slate-100">Loading…</Text>
      </View>
    );
  }

  const capacityMCM = dam.capacity / 1_000_000;

  return (
    <ScrollView className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]" contentInsetAdjustmentBehavior="automatic">
      <View className="pb-10">
        <View className="relative">
          {dam.imageUrl
            ? <Image source={{ uri: dam.imageUrl }} className="w-full h-[260px]" resizeMode="cover" />
            : <View className="w-full h-[260px] bg-white dark:bg-gray-900" />}

          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 rounded-full p-2 bg-black/40"
            style={{ top: insets.top + 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <GlassCard className="absolute bottom-4 left-4 right-4" padding={16}>
            <Text className="text-white text-[20px] font-extrabold mb-0.5">{dam.nameEn}</Text>
            <Text className={`text-[28px] font-extrabold mb-0.5 ${getFillClass(pct)}`}>{formatPercentage(pct)}</Text>
            <Text className="text-white/70 text-[13px] mb-2">{formatMCM(storageMCM)} / {formatMCM(capacityMCM)}</Text>
            <FillBar percentage={pct} height={6} />
          </GlassCard>
        </View>

        <View className="flex-row flex-wrap p-3 gap-2">
          {[
            { label: 'Height',       value: `${dam.height}m` },
            { label: 'Built',        value: `${dam.yearOfConstruction}` },
            { label: 'Inflow today', value: `${inflowMCM.toFixed(3)} MCM` },
            { label: 'Type',         value: dam.typeEl },
          ].map(stat => (
            <View key={stat.label} className="w-[47%] rounded-xl p-3 bg-white dark:bg-gray-900">
              <Text className="text-[11px] font-semibold mb-0.5 text-slate-500 dark:text-slate-400">{stat.label}</Text>
              <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{stat.value}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center gap-2 mx-4 rounded-xl p-3 mb-2 bg-white dark:bg-gray-900">
          <Ionicons name="water" size={16} color="#0EA5E9" />
          <Text className="text-[13px] text-slate-900 dark:text-slate-100">River: {dam.riverNameEl}</Text>
        </View>

        {dam.wikipediaUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(dam.wikipediaUrl)}
            className="mx-4 mt-2 border rounded-xl p-3 items-center"
            style={{ borderColor: '#0EA5E9' }}
          >
            <Text className="text-sm font-semibold text-sky-500">View on Wikipedia →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}
