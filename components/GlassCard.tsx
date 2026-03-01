import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function GlassCard({ children, style, padding = 16 }: GlassCardProps) {
  const { isDark, blurIntensity, colors } = useTheme();
  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blur, style]}
    >
      <View style={[styles.overlay, { backgroundColor: colors.cardOverlay, borderColor: colors.cardBorder, padding }]}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur:    { borderRadius: 20, overflow: 'hidden' },
  overlay: { borderWidth: 1, borderRadius: 20 },
});
