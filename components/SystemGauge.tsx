import { useColorScheme } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { formatPercentage } from '../lib/format';
import { getFillClass } from '../lib/utils';
import { GlassCard } from './GlassCard';

const SIZE   = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const ARC_DEG    = 240;
const START_ANGLE = 150;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number): string {
  const s = polar(CENTER, CENTER, RADIUS, endDeg);
  const e = polar(CENTER, CENTER, RADIUS, startDeg);
  const large = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${s.x} ${s.y} A ${RADIUS} ${RADIUS} 0 ${large} 0 ${e.x} ${e.y}`;
}

interface SystemGaugeProps {
  percentage: number;
  date: string;
  totalCapacityInMCM?: number;
}

export function SystemGauge({ percentage, date }: SystemGaugeProps) {
  const { colorScheme } = useColorScheme();

  const endAngle  = START_ANGLE + ARC_DEG;
  const fillAngle = START_ANGLE + ARC_DEG * percentage;
  const trackPath = arc(START_ANGLE, endAngle);
  const fillPath  = percentage > 0 ? arc(START_ANGLE, fillAngle) : '';

  const trackColor = colorScheme === 'dark' ? '#111827' : '#FFFFFF';
  const fillColor  = percentage < 0.2 ? '#EF4444' : percentage < 0.5 ? '#F59E0B' : '#10B981';

  return (
    <GlassCard className="m-4 items-center">
      <View className="items-center justify-center">
        <Svg width={SIZE} height={SIZE}>
          <Path d={trackPath} stroke={trackColor} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          {fillPath ? <Path d={fillPath} stroke={fillColor} strokeWidth={STROKE} fill="none" strokeLinecap="round" /> : null}
        </Svg>
        <View className="absolute items-center">
          <Text className={`text-[36px] font-extrabold tracking-[-1px] ${getFillClass(percentage)}`}>
            {formatPercentage(percentage)}
          </Text>
          <Text className="text-xs font-medium mt-0.5 text-slate-500 dark:text-slate-400">System capacity</Text>
        </View>
      </View>
      <Text className="text-xs mt-1 mb-1 text-slate-500 dark:text-slate-400">{date}</Text>
    </GlassCard>
  );
}
