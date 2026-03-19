import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatMCM, formatPercentage } from '../lib/format';
import { getFillClass } from '../lib/utils';
import { FillBar } from './FillBar';

/** percentage: fractional value 0.0–1.0 */
interface DamRowProps {
  name: string;
  percentage: number;
  capacityMCM: number;
  storageMCM: number;
  onPress: () => void;
}

export function DamRow({ name, percentage, capacityMCM, storageMCM, onPress }: DamRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-[14px] p-3.5 mx-4 mb-2.5 bg-white dark:bg-gray-900"
    >
      <View className="flex-row justify-between mb-2">
        <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{name}</Text>
        <Text className={`text-[15px] font-bold ${getFillClass(percentage)}`}>{formatPercentage(percentage)}</Text>
      </View>
      <FillBar percentage={percentage} height={5} />
      <View className="flex-row justify-between mt-1.5">
        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{formatMCM(storageMCM)} stored</Text>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{formatMCM(capacityMCM)} capacity</Text>
      </View>
    </TouchableOpacity>
  );
}
