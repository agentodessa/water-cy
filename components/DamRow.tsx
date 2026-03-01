import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FillBar } from './FillBar';
import { formatMCM, formatPercentage } from '../lib/format';
import { getFillColor } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

/** percentage: fractional value 0.0–1.0 */
interface DamRowProps {
  name: string;
  percentage: number;
  /** capacity in MCM (million cubic meters) */
  capacityMCM: number;
  /** storage in MCM */
  storageMCM: number;
  onPress: () => void;
}

export function DamRow({ name, percentage, capacityMCM, storageMCM, onPress }: DamRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={styles.top}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.pct, { color: getFillColor(percentage) }]}>{formatPercentage(percentage)}</Text>
      </View>
      <FillBar percentage={percentage} height={5} />
      <View style={styles.bottom}>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{formatMCM(storageMCM)} stored</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{formatMCM(capacityMCM)} capacity</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:    { borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  top:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name:   { fontSize: 15, fontWeight: '700' },
  pct:    { fontSize: 15, fontWeight: '700' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sub:    { fontSize: 11 },
});
