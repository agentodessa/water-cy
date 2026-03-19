import React from 'react';
import { Text } from 'react-native';
import { formatPercentage } from '../lib/format';
import { getFillClass } from '../lib/utils';
import { FillBar } from './FillBar';
import { GlassCard } from './GlassCard';

interface DamCardProps { name: string; percentage: number; }

export function DamCard({ name, percentage }: DamCardProps) {
  return (
    <GlassCard className="w-[110px] mr-2.5" padding={12}>
      <Text className="text-xs font-semibold mb-1 text-slate-900 dark:text-slate-100" numberOfLines={1}>{name}</Text>
      <Text className={`text-[18px] font-extrabold mb-1.5 ${getFillClass(percentage)}`}>{formatPercentage(percentage)}</Text>
      <FillBar percentage={percentage} height={4} />
    </GlassCard>
  );
}
