import React from 'react';
import { View } from 'react-native';
import { getFillBgClass } from '../lib/utils';

/** percentage: fractional value 0.0–1.0 (e.g. 0.65 = 65%) */
interface FillBarProps {
  percentage: number;
  height?: number;
}

export function FillBar({ percentage, height = 6 }: FillBarProps) {
  const clampedPct = Math.min(Math.max(percentage * 100, 0), 100);
  return (
    <View className="rounded-[3px] overflow-hidden w-full bg-white dark:bg-gray-900" style={{ height }}>
      <View
        className={`rounded-[3px] ${getFillBgClass(percentage)}`}
        style={{ width: `${clampedPct}%`, height }}
      />
    </View>
  );
}
