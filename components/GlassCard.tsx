import { BlurView } from 'expo-blur';
import { cssInterop, useColorScheme } from 'nativewind';
import React from 'react';
import { View, ViewStyle } from 'react-native';

cssInterop(BlurView, { className: 'style' });

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  padding?: number;
}

export function GlassCard({ children, className, style, padding = 16 }: GlassCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const blurIntensity = isDark ? 80 : 60;

  const cardOverlay = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.12)';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)';

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      className={`rounded-[20px] overflow-hidden ${className ?? ''}`}
      style={style}
    >
      <View
        className="rounded-[20px] border"
        style={{ backgroundColor: cardOverlay, borderColor: cardBorder, padding }}
      >
        {children}
      </View>
    </BlurView>
  );
}
