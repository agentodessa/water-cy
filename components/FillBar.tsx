import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getFillColor } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface FillBarProps {
  percentage: number;
  height?: number;
}

export function FillBar({ percentage, height = 6 }: FillBarProps) {
  const { colors } = useTheme();
  const fillColor = getFillColor(percentage);
  const clampedPct = Math.min(Math.max(percentage * 100, 0), 100);
  return (
    <View style={[styles.track, { height, backgroundColor: colors.surface }]}>
      <View style={[styles.fill, { width: `${clampedPct}%`, height, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 3, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 3 },
});
