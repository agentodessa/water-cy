import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GlassCard } from './GlassCard';
import { getFillColor } from '../theme/colors';
import { formatPercentage } from '../lib/format';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors } = useTheme();

  const endAngle  = START_ANGLE + ARC_DEG;
  const fillAngle = START_ANGLE + ARC_DEG * percentage;
  const trackPath = arc(START_ANGLE, endAngle);
  const fillPath  = percentage > 0 ? arc(START_ANGLE, fillAngle) : '';
  const fillColor = getFillColor(percentage);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.container}>
        <Svg width={SIZE} height={SIZE}>
          <Path d={trackPath} stroke={colors.surface} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          {fillPath ? <Path d={fillPath} stroke={fillColor} strokeWidth={STROKE} fill="none" strokeLinecap="round" /> : null}
        </Svg>
        <View style={styles.centerText}>
          <Text style={[styles.pct, { color: fillColor }]}>{formatPercentage(percentage)}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>System capacity</Text>
        </View>
      </View>
      <Text style={[styles.date, { color: colors.textSecondary }]}>{date}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card:       { margin: 16, alignItems: 'center' },
  container:  { alignItems: 'center', justifyContent: 'center' },
  centerText: { position: 'absolute', alignItems: 'center' },
  pct:        { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  label:      { fontSize: 12, fontWeight: '500', marginTop: 2 },
  date:       { fontSize: 12, marginTop: 4, marginBottom: 4 },
});
