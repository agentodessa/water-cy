import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FillBar } from './FillBar';
import { GlassCard } from './GlassCard';
import { getFillColor } from '../theme/colors';
import { formatPercentage } from '../lib/format';
import { useTheme } from '../theme/ThemeContext';

interface DamCardProps { name: string; percentage: number; }

export function DamCard({ name, percentage }: DamCardProps) {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.card} padding={12}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
      <Text style={[styles.pct, { color: getFillColor(percentage) }]}>{formatPercentage(percentage)}</Text>
      <FillBar percentage={percentage} height={4} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { width: 110, marginRight: 10 },
  name: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  pct:  { fontSize: 18, fontWeight: '800', marginBottom: 6 },
});
