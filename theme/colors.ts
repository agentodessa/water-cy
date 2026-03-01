export const palette = {
  accent:  '#0EA5E9',
  danger:  '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

export const lightColors = {
  background:    '#F0F4F8',
  surface:       '#FFFFFF',
  card:          'rgba(255,255,255,0.7)',
  cardBorder:    'rgba(255,255,255,0.3)',
  cardOverlay:   'rgba(255,255,255,0.12)',
  text:          '#0F172A',
  textSecondary: '#64748B',
  ...palette,
};

export const darkColors = {
  background:    '#0A0F1E',
  surface:       '#111827',
  card:          'rgba(255,255,255,0.08)',
  cardBorder:    'rgba(255,255,255,0.15)',
  cardOverlay:   'rgba(0,0,0,0.3)',
  text:          '#F1F5F9',
  textSecondary: '#94A3B8',
  ...palette,
};

export type AppColors = typeof lightColors;

export function getFillColor(percentage: number): string {
  if (percentage < 0.2) return palette.danger;
  if (percentage < 0.5) return palette.warning;
  return palette.success;
}
