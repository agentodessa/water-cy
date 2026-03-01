# Cyprus Water App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Expo iOS/Android app displaying Cyprus reservoir data with charts, dark/light themes, and liquid glass design.

**Architecture:** Three-tab expo-router app (Home/Dams/Trends) with TanStack Query for data fetching. Theme via React Context + system color scheme with AsyncStorage override. Liquid glass via expo-blur BlurView with semi-transparent overlays.

**Tech Stack:** Expo SDK 52, expo-router, TypeScript, @tanstack/react-query v5, victory-native v36, react-native-svg, expo-blur, react-native-reanimated, @react-native-async-storage/async-storage

---

### Task 1: Initialize Expo project and install dependencies

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `jest.config.js` (via create-expo-app)

**Step 1: Create the Expo project**

Run from `/Users/test/repos/pet/water-app`:
```bash
npx create-expo-app@latest . --template blank-typescript
```
When prompted about existing files (docs/), accept/continue.

**Step 2: Install all dependencies**
```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-blur @react-native-async-storage/async-storage react-native-svg
npm install @tanstack/react-query@5 "victory-native@^36"
npx expo install react-native-reanimated
```

**Step 3: Set expo-router as entry point**

In `package.json`, change the `"main"` field:
```json
"main": "expo-router/entry"
```

**Step 4: Update app.json**
```json
{
  "expo": {
    "name": "Cyprus Water",
    "slug": "cyprus-water",
    "scheme": "cyprus-water",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0F1E"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": { "supportsTablet": true },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0F1E"
      }
    },
    "plugins": ["expo-router"]
  }
}
```

**Step 5: Update babel.config.js** (add reanimated plugin — must be last)
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Step 6: Update jest.config.js**
```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!.*node_modules).*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterFramework: [],
};
```

**Step 7: Verify Metro starts**
```bash
npx expo start
```
Expected: Metro bundler starts without errors.

**Step 8: Init git and commit**
```bash
git init
git add .
git commit -m "feat: initialize expo project with all dependencies"
```

---

### Task 2: Theme system and format utilities

**Files:**
- Create: `theme/colors.ts`
- Create: `theme/ThemeContext.tsx`
- Create: `lib/format.ts`
- Create: `__tests__/theme.test.ts`
- Create: `__tests__/format.test.ts`

**Step 1: Write failing tests**

`__tests__/theme.test.ts`:
```ts
import { getFillColor } from '../theme/colors';

describe('getFillColor', () => {
  it('returns danger for < 20%', () => {
    expect(getFillColor(0.1)).toBe('#EF4444');
    expect(getFillColor(0.199)).toBe('#EF4444');
  });
  it('returns warning for 20–50%', () => {
    expect(getFillColor(0.2)).toBe('#F59E0B');
    expect(getFillColor(0.499)).toBe('#F59E0B');
  });
  it('returns success for >= 50%', () => {
    expect(getFillColor(0.5)).toBe('#10B981');
    expect(getFillColor(1.0)).toBe('#10B981');
  });
});
```

`__tests__/format.test.ts`:
```ts
import { formatMCM, formatPercentage } from '../lib/format';

describe('formatMCM', () => {
  it('formats values < 1 with 3 decimal places', () => {
    expect(formatMCM(0.717)).toBe('0.717 MCM');
  });
  it('formats large values with 1 decimal place', () => {
    expect(formatMCM(21.09)).toBe('21.1 MCM');
    expect(formatMCM(115)).toBe('115.0 MCM');
  });
});

describe('formatPercentage', () => {
  it('formats as percentage string', () => {
    expect(formatPercentage(0.203)).toBe('20.3%');
    expect(formatPercentage(1.0)).toBe('100.0%');
  });
});
```

**Step 2: Run tests — expect FAIL**
```bash
npx jest __tests__/theme.test.ts __tests__/format.test.ts
```
Expected: FAIL — "Cannot find module"

**Step 3: Implement `theme/colors.ts`**
```ts
export const palette = {
  accent:  '#0EA5E9',
  danger:  '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

export const lightColors = {
  background:   '#F0F4F8',
  surface:      '#FFFFFF',
  card:         'rgba(255,255,255,0.7)',
  cardBorder:   'rgba(255,255,255,0.3)',
  cardOverlay:  'rgba(255,255,255,0.12)',
  text:         '#0F172A',
  textSecondary:'#64748B',
  ...palette,
};

export const darkColors = {
  background:   '#0A0F1E',
  surface:      '#111827',
  card:         'rgba(255,255,255,0.08)',
  cardBorder:   'rgba(255,255,255,0.15)',
  cardOverlay:  'rgba(0,0,0,0.3)',
  text:         '#F1F5F9',
  textSecondary:'#94A3B8',
  ...palette,
};

export type AppColors = typeof lightColors;

export function getFillColor(percentage: number): string {
  if (percentage < 0.2) return palette.danger;
  if (percentage < 0.5) return palette.warning;
  return palette.success;
}
```

**Step 4: Implement `lib/format.ts`**
```ts
export function formatMCM(value: number): string {
  return value < 1 ? `${value.toFixed(3)} MCM` : `${value.toFixed(1)} MCM`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
```

**Step 5: Run tests — expect PASS**
```bash
npx jest __tests__/theme.test.ts __tests__/format.test.ts
```
Expected: PASS (6 assertions green)

**Step 6: Implement `theme/ThemeContext.tsx`**
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, darkColors, lightColors } from './colors';

type ThemeContextValue = {
  isDark: boolean;
  colors: AppColors;
  blurIntensity: number;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  blurIntensity: 60,
  toggleTheme: () => {},
});

const STORAGE_KEY = '@cyprus_water_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark') setOverride(value);
    });
  }, []);

  const isDark = override ? override === 'dark' : systemScheme === 'dark';

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setOverride(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{
      isDark,
      colors: isDark ? darkColors : lightColors,
      blurIntensity: isDark ? 80 : 60,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

**Step 7: Commit**
```bash
git add theme/ lib/format.ts __tests__/
git commit -m "feat: add theme system and format utilities"
```

---

### Task 3: Typed API client

**Files:**
- Create: `lib/api.ts`
- Create: `__tests__/api.test.ts`

**Step 1: Write failing tests**

`__tests__/api.test.ts`:
```ts
import { fetchDams, fetchPercentages } from '../lib/api';

global.fetch = jest.fn();

const mockFetch = (data: unknown) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

beforeEach(() => jest.clearAllMocks());

describe('fetchPercentages', () => {
  it('returns percentages from correct URL', async () => {
    mockFetch({ damNamesToPercentage: { Kouris: 0.183 }, totalPercentage: 0.203, date: 'Feb 27, 2026', totalCapacityInMCM: 290.5 });
    const result = await fetchPercentages();
    expect(result.totalPercentage).toBe(0.203);
    expect(result.damNamesToPercentage['Kouris']).toBe(0.183);
    expect(fetch).toHaveBeenCalledWith('https://cyprus-water.appspot.com/api/percentages');
  });
});

describe('fetchDams', () => {
  it('returns array of dams', async () => {
    mockFetch([{ nameEn: 'Kouris', capacity: 115000000 }]);
    const result = await fetchDams();
    expect(result).toHaveLength(1);
    expect(result[0].nameEn).toBe('Kouris');
  });
});
```

**Step 2: Run tests — expect FAIL**
```bash
npx jest __tests__/api.test.ts
```
Expected: FAIL — "Cannot find module '../lib/api'"

**Step 3: Implement `lib/api.ts`**
```ts
const BASE = 'https://cyprus-water.appspot.com/api';

export interface Dam {
  nameEn: string;
  nameEl: string;
  yearOfConstruction: number;
  height: number;
  capacity: number;
  lat: number;
  lng: number;
  riverNameEl: string;
  typeEl: string;
  imageUrl: string;
  wikipediaUrl: string;
}

export interface Percentages {
  damNamesToPercentage: Record<string, number>;
  date: string;
  totalPercentage: number;
  totalCapacityInMCM: number;
}

export interface DateStatistics {
  timestamp: number;
  date: string;
  storageInMCM: Record<string, number>;
  inflowInMCM: Record<string, number>;
}

export interface MonthlyInflow {
  timestamp: number;
  year: number;
  period: string;
  periodOrder: number;
  inflowInMCM: number;
}

export interface Event {
  [key: string]: unknown;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchPercentages    = () => get<Percentages>('/percentages');
export const fetchDams           = () => get<Dam[]>('/dams');
export const fetchMonthlyInflows = () => get<MonthlyInflow[]>('/monthly-inflows');
export const fetchEvents         = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  const q = params.toString();
  return get<Event[]>(q ? `/events?${q}` : '/events');
};
export const fetchDateStatistics = (date?: string) =>
  get<DateStatistics>(date ? `/date-statistics?date=${date}` : '/date-statistics');
```

**Step 4: Run tests — expect PASS**
```bash
npx jest __tests__/api.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add lib/api.ts __tests__/api.test.ts
git commit -m "feat: add typed API client"
```

---

### Task 4: TanStack Query hooks and root layout

**Files:**
- Create: `hooks/usePercentages.ts`
- Create: `hooks/useDams.ts`
- Create: `hooks/useDateStatistics.ts`
- Create: `hooks/useMonthlyInflows.ts`
- Create: `hooks/useEvents.ts`
- Create: `app/_layout.tsx`

**Step 1: Create all five hooks**

`hooks/usePercentages.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchPercentages } from '../lib/api';

export function usePercentages() {
  return useQuery({
    queryKey: ['percentages'],
    queryFn: fetchPercentages,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

`hooks/useDams.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchDams } from '../lib/api';

export function useDams() {
  return useQuery({
    queryKey: ['dams'],
    queryFn: fetchDams,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

`hooks/useDateStatistics.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchDateStatistics } from '../lib/api';

export function useDateStatistics(date?: string) {
  return useQuery({
    queryKey: ['date-statistics', date],
    queryFn: () => fetchDateStatistics(date),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

`hooks/useMonthlyInflows.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyInflows } from '../lib/api';

export function useMonthlyInflows() {
  return useQuery({
    queryKey: ['monthly-inflows'],
    queryFn: fetchMonthlyInflows,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

`hooks/useEvents.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../lib/api';

export function useEvents(from?: string, to?: string) {
  return useQuery({
    queryKey: ['events', from, to],
    queryFn: () => fetchEvents(from, to),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

**Step 2: Create root layout**

`app/_layout.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Step 3: Commit**
```bash
git add hooks/ app/_layout.tsx
git commit -m "feat: add TanStack Query hooks and root layout"
```

---

### Task 5: Shared components — GlassCard, FillBar, Shimmer

**Files:**
- Create: `components/GlassCard.tsx`
- Create: `components/FillBar.tsx`
- Create: `components/Shimmer.tsx`

**Step 1: Implement `components/GlassCard.tsx`**
```tsx
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
```

**Step 2: Implement `components/FillBar.tsx`**
```tsx
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
  const width = `${Math.min(Math.max(percentage * 100, 0), 100)}%` as `${number}%`;
  return (
    <View style={[styles.track, { height, backgroundColor: colors.surface }]}>
      <View style={[styles.fill, { width, height, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 3, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 3 },
});
```

**Step 3: Implement `components/Shimmer.tsx`**
```tsx
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: colors.surface }, animStyle, style]}
    />
  );
}
```

**Step 4: Commit**
```bash
git add components/
git commit -m "feat: add GlassCard, FillBar, and Shimmer shared components"
```

---

### Task 6: Navigation shell

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/dams.tsx`
- Create: `app/(tabs)/trends.tsx`
- Create: `app/dam/[name].tsx`

**Step 1: Implement `app/(tabs)/_layout.tsx`**
```tsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function TabLayout() {
  const { isDark, blurIntensity, colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: colors.cardBorder,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="dams"
        options={{ title: 'Dams', tabBarIcon: ({ color, size }) => <Ionicons name="layers" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="trends"
        options={{ title: 'Trends', tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
```

**Step 2: Create placeholder screens**

`app/(tabs)/index.tsx`:
```tsx
import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function HomeScreen() {
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>Home</Text></SafeAreaView>;
}
```

`app/(tabs)/dams.tsx`:
```tsx
import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function DamsScreen() {
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>Dams</Text></SafeAreaView>;
}
```

`app/(tabs)/trends.tsx`:
```tsx
import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function TrendsScreen() {
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>Trends</Text></SafeAreaView>;
}
```

`app/dam/[name].tsx`:
```tsx
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>{name}</Text></SafeAreaView>;
}
```

**Step 3: Verify three tabs appear in simulator**
```bash
npx expo start
```
Expected: Three tabs visible at bottom, each showing placeholder text.

**Step 4: Commit**
```bash
git add app/
git commit -m "feat: add navigation shell with tab layout and placeholder screens"
```

---

### Task 7: SystemGauge component

**Files:**
- Create: `components/SystemGauge.tsx`
- Create: `__tests__/SystemGauge.test.tsx`

**Step 1: Write failing test**

`__tests__/SystemGauge.test.tsx`:
```tsx
import { render } from '@testing-library/react-native';
import React from 'react';
import { SystemGauge } from '../components/SystemGauge';
import { ThemeProvider } from '../theme/ThemeContext';

jest.mock('expo-blur', () => ({ BlurView: ({ children }: any) => children }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

it('renders percentage text', () => {
  const { getByText } = render(
    <ThemeProvider><SystemGauge percentage={0.203} date="Feb 27, 2026" /></ThemeProvider>
  );
  expect(getByText('20.3%')).toBeTruthy();
  expect(getByText('Feb 27, 2026')).toBeTruthy();
});
```

**Step 2: Run test — expect FAIL**
```bash
npx jest __tests__/SystemGauge.test.tsx
```
Expected: FAIL

**Step 3: Implement `components/SystemGauge.tsx`**
```tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { getFillColor } from '../theme/colors';
import { formatPercentage } from '../lib/format';
import { useTheme } from '../theme/ThemeContext';

const SIZE   = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const ARC_DEG = 240;
const START_ANGLE = 150;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number) {
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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 1200 });
  }, [percentage, progress]);

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
```

**Step 4: Run test — expect PASS**
```bash
npx jest __tests__/SystemGauge.test.tsx
```

**Step 5: Commit**
```bash
git add components/SystemGauge.tsx __tests__/SystemGauge.test.tsx
git commit -m "feat: add SystemGauge with SVG arc"
```

---

### Task 8: DamCard component + full Home screen

**Files:**
- Create: `components/DamCard.tsx`
- Modify: `app/(tabs)/index.tsx`

**Step 1: Implement `components/DamCard.tsx`**
```tsx
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
```

**Step 2: Implement full `app/(tabs)/index.tsx`**
```tsx
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamCard } from '../../components/DamCard';
import { Shimmer } from '../../components/Shimmer';
import { SystemGauge } from '../../components/SystemGauge';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { useTheme } from '../../theme/ThemeContext';

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: percentages, isLoading: loadingPct, refetch: refetchPct } = usePercentages();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useDateStatistics();
  const isLoading = loadingPct || loadingStats;

  const damEntries = percentages
    ? Object.entries(percentages.damNamesToPercentage).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetchPct(); refetchStats(); }} tintColor={colors.accent} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Cyprus Water</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <Shimmer height={240} borderRadius={20} style={{ margin: 16 }} />
        : percentages
          ? <SystemGauge percentage={percentages.totalPercentage} date={percentages.date} totalCapacityInMCM={percentages.totalCapacityInMCM} />
          : null}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>All Reservoirs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Shimmer key={i} width={110} height={90} borderRadius={20} style={{ marginRight: 10 }} />)
          : damEntries.map(([name, pct]) => <DamCard key={name} name={name} percentage={pct} />)}
      </ScrollView>

      {stats && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Inflow (MCM)</Text>
          <View style={styles.inflowGrid}>
            {Object.entries(stats.inflowInMCM)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([name, inflow]) => (
                <View key={name} style={[styles.inflowItem, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.inflowName, { color: colors.textSecondary }]} numberOfLines={1}>{name}</Text>
                  <Text style={[styles.inflowValue, { color: colors.accent }]}>{inflow.toFixed(3)}</Text>
                </View>
              ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  title:       { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  themeBtn:    { padding: 8 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  strip:       { paddingHorizontal: 16, paddingBottom: 4 },
  inflowGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  inflowItem:  { width: '30%', borderRadius: 12, padding: 10 },
  inflowName:  { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  inflowValue: { fontSize: 14, fontWeight: '700' },
});
```

**Step 3: Commit**
```bash
git add components/DamCard.tsx app/(tabs)/index.tsx
git commit -m "feat: implement Home tab with gauge, dam strip, and inflow grid"
```

---

### Task 9: DamRow component + Dams screen

**Files:**
- Create: `components/DamRow.tsx`
- Create: `__tests__/DamRow.test.tsx`
- Modify: `app/(tabs)/dams.tsx`

**Step 1: Write failing test**

`__tests__/DamRow.test.tsx`:
```tsx
import { render } from '@testing-library/react-native';
import React from 'react';
import { DamRow } from '../components/DamRow';
import { ThemeProvider } from '../theme/ThemeContext';

it('renders dam name and percentage', () => {
  const { getByText } = render(
    <ThemeProvider>
      <DamRow name="Kouris" percentage={0.183} capacityMCM={115} storageMCM={21.09} onPress={() => {}} />
    </ThemeProvider>
  );
  expect(getByText('Kouris')).toBeTruthy();
  expect(getByText('18.3%')).toBeTruthy();
});
```

**Step 2: Run test — expect FAIL**
```bash
npx jest __tests__/DamRow.test.tsx
```

**Step 3: Implement `components/DamRow.tsx`**
```tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FillBar } from './FillBar';
import { formatMCM, formatPercentage } from '../lib/format';
import { getFillColor } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface DamRowProps {
  name: string;
  percentage: number;
  capacityMCM: number;
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
```

**Step 4: Run test — expect PASS**
```bash
npx jest __tests__/DamRow.test.tsx
```

**Step 5: Implement `app/(tabs)/dams.tsx`**
```tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamRow } from '../../components/DamRow';
import { Shimmer } from '../../components/Shimmer';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { useTheme } from '../../theme/ThemeContext';

type SortKey = 'fill' | 'capacity' | 'name';

export default function DamsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>('fill');

  const { data: dams,        isLoading: l1, refetch: r1 } = useDams();
  const { data: percentages, isLoading: l2, refetch: r2 } = usePercentages();
  const { data: stats } = useDateStatistics();
  const isLoading = l1 || l2;

  const rows = dams && percentages
    ? [...dams]
        .map(dam => ({
          dam,
          pct:       percentages.damNamesToPercentage[dam.nameEn] ?? 0,
          storageMCM: stats?.storageInMCM[dam.nameEn] ?? 0,
        }))
        .sort((a, b) => {
          if (sort === 'fill')     return b.pct - a.pct;
          if (sort === 'capacity') return b.dam.capacity - a.dam.capacity;
          return a.dam.nameEn.localeCompare(b.dam.nameEn);
        })
    : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { r1(); r2(); }} tintColor={colors.accent} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Reservoirs</Text>
        <View style={styles.sortRow}>
          {(['fill', 'capacity', 'name'] as SortKey[]).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setSort(key)}
              style={[styles.chip, { backgroundColor: sort === key ? colors.accent : colors.surface }]}
            >
              <Text style={[styles.chipText, { color: sort === key ? '#fff' : colors.textSecondary }]}>
                {key === 'fill' ? 'Fill %' : key === 'capacity' ? 'Capacity' : 'Name'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} height={80} borderRadius={14} style={{ marginHorizontal: 16, marginBottom: 10 }} />
          ))
        : rows.map(({ dam, pct, storageMCM }) => (
            <DamRow
              key={dam.nameEn}
              name={dam.nameEn}
              percentage={pct}
              capacityMCM={dam.capacity / 1_000_000}
              storageMCM={storageMCM}
              onPress={() => router.push(`/dam/${dam.nameEn}`)}
            />
          ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { paddingHorizontal: 16, paddingBottom: 12 },
  title:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12 },
  sortRow:   { flexDirection: 'row', gap: 8 },
  chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText:  { fontSize: 12, fontWeight: '600' },
});
```

**Step 6: Commit**
```bash
git add components/DamRow.tsx __tests__/DamRow.test.tsx app/(tabs)/dams.tsx
git commit -m "feat: implement Dams tab with sortable reservoir list"
```

---

### Task 10: Dam detail screen

**Files:**
- Modify: `app/dam/[name].tsx`

**Step 1: Implement `app/dam/[name].tsx`**
```tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { FillBar } from '../../components/FillBar';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { formatMCM, formatPercentage } from '../../lib/format';
import { getFillColor } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: dams }        = useDams();
  const { data: percentages } = usePercentages();
  const { data: stats }       = useDateStatistics();

  const dam        = dams?.find(d => d.nameEn === name);
  const pct        = percentages?.damNamesToPercentage[name ?? ''] ?? 0;
  const storageMCM = stats?.storageInMCM[name ?? ''] ?? 0;
  const inflowMCM  = stats?.inflowInMCM[name ?? ''] ?? 0;

  if (!dam) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading…</Text>
      </View>
    );
  }

  const capacityMCM = dam.capacity / 1_000_000;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.imageContainer}>
        {dam.imageUrl
          ? <Image source={{ uri: dam.imageUrl }} style={styles.image} />
          : <View style={[styles.image, { backgroundColor: colors.surface }]} />}

        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 8 }]}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <GlassCard style={styles.imageOverlay} padding={16}>
          <Text style={styles.overlayName}>{dam.nameEn}</Text>
          <Text style={[styles.overlayPct, { color: getFillColor(pct) }]}>{formatPercentage(pct)}</Text>
          <Text style={styles.overlaySub}>{formatMCM(storageMCM)} / {formatMCM(capacityMCM)}</Text>
          <FillBar percentage={pct} height={6} />
        </GlassCard>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Height',       value: `${dam.height}m` },
          { label: 'Built',        value: `${dam.yearOfConstruction}` },
          { label: 'Inflow today', value: `${inflowMCM.toFixed(3)} MCM` },
          { label: 'Type',         value: dam.typeEl },
        ].map(stat => (
          <View key={stat.label} style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
        <Ionicons name="water" size={16} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.text }]}>River: {dam.riverNameEl}</Text>
      </View>

      {dam.wikipediaUrl ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(dam.wikipediaUrl)}
          style={[styles.wikiBtn, { borderColor: colors.accent }]}
        >
          <Text style={[styles.wikiText, { color: colors.accent }]}>View on Wikipedia →</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageContainer:{ position: 'relative' },
  image:        { width: '100%', height: 260, resizeMode: 'cover' },
  backBtn:      { position: 'absolute', left: 16, borderRadius: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  imageOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  overlayName:  { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  overlayPct:   { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  overlaySub:   { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statBox:      { width: '47%', borderRadius: 12, padding: 12 },
  statLabel:    { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  statValue:    { fontSize: 15, fontWeight: '700' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 8 },
  infoText:     { fontSize: 13 },
  wikiBtn:      { marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  wikiText:     { fontSize: 14, fontWeight: '600' },
});
```

**Step 2: Commit**
```bash
git add app/dam/[name].tsx
git commit -m "feat: implement Dam detail screen with image overlay and stats"
```

---

### Task 11: Trends tab

**Files:**
- Modify: `app/(tabs)/trends.tsx`

**Step 1: Implement `app/(tabs)/trends.tsx`**
```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { Shimmer } from '../../components/Shimmer';
import { useMonthlyInflows } from '../../hooks/useMonthlyInflows';
import { useTheme } from '../../theme/ThemeContext';

type Period = '1Y' | '3Y' | '5Y' | 'ALL';
const PERIOD_YEARS: Record<Period, number | null> = { '1Y': 1, '3Y': 3, '5Y': 5, 'ALL': null };
const YEAR_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const CHART_WIDTH = Dimensions.get('window').width - 32;
const CHART_HEIGHT = 200;

export default function TrendsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('5Y');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const { data: inflows, isLoading, refetch } = useMonthlyInflows();
  const currentYear = new Date().getFullYear();

  const filtered = useMemo(() => {
    if (!inflows) return [];
    const limit = PERIOD_YEARS[period];
    return limit ? inflows.filter(r => r.year >= currentYear - limit) : inflows;
  }, [inflows, period, currentYear]);

  const areaData = useMemo(() =>
    filtered.map(r => ({ x: r.year + (r.periodOrder - 1) / 12, y: r.inflowInMCM })),
  [filtered]);

  const availableYears = useMemo(() => {
    if (!inflows) return [];
    return [...new Set(inflows.map(r => r.year))].sort().reverse().slice(0, 10);
  }, [inflows]);

  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears(availableYears.slice(0, 3));
    }
  }, [availableYears]);

  const yoyData = useMemo(() => {
    if (!inflows) return [];
    return selectedYears.map((year, i) => ({
      year,
      color: YEAR_COLORS[i % YEAR_COLORS.length],
      data: inflows
        .filter(r => r.year === year)
        .sort((a, b) => a.periodOrder - b.periodOrder)
        .map(r => ({ x: r.periodOrder, y: r.inflowInMCM })),
    }));
  }, [inflows, selectedYears]);

  const toggleYear = (year: number) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].slice(-5)
  );

  const axisStyle = {
    axis: { stroke: colors.textSecondary },
    tickLabels: { fill: colors.textSecondary, fontSize: 9 },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Historical Trends</Text>
      </View>

      <View style={styles.filterRow}>
        {(['1Y', '3Y', '5Y', 'ALL'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.chip, { backgroundColor: period === p ? colors.accent : colors.surface }]}
          >
            <Text style={[styles.chipText, { color: period === p ? '#fff' : colors.textSecondary }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Inflows (MCM)</Text>
      {isLoading
        ? <Shimmer height={CHART_HEIGHT} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <VictoryChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis style={axisStyle} tickFormat={t => Math.round(t).toString()} />
              <VictoryAxis dependentAxis style={axisStyle} />
              <VictoryArea
                data={areaData}
                style={{ data: { fill: `${colors.accent}33`, stroke: colors.accent, strokeWidth: 2 } }}
              />
            </VictoryChart>
          </View>
        )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Year-over-Year</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearChips}>
        {availableYears.map((year) => {
          const idx = selectedYears.indexOf(year);
          const isSelected = idx >= 0;
          return (
            <TouchableOpacity
              key={year}
              onPress={() => toggleYear(year)}
              style={[styles.chip, { backgroundColor: isSelected ? YEAR_COLORS[idx % YEAR_COLORS.length] : colors.surface }]}
            >
              <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>{year}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading
        ? <Shimmer height={CHART_HEIGHT} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <VictoryChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis
                style={axisStyle}
                tickFormat={t => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t - 1] ?? t}
              />
              <VictoryAxis dependentAxis style={axisStyle} />
              {yoyData.map(({ year, color, data }) => (
                <VictoryLine key={year} data={data} style={{ data: { stroke: color, strokeWidth: 2 } }} />
              ))}
            </VictoryChart>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { paddingHorizontal: 16, paddingBottom: 12 },
  title:       { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  filterRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10, marginTop: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  chipText:    { fontSize: 13, fontWeight: '600' },
  chartCard:   { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  yearChips:   { paddingHorizontal: 16, gap: 8, marginBottom: 10 },
});
```

**Step 2: Commit**
```bash
git add app/(tabs)/trends.tsx
git commit -m "feat: implement Trends tab with area chart and year-over-year comparison"
```

---

### Task 12: Final verification

**Step 1: Run all tests**
```bash
npx jest
```
Expected: All tests PASS

**Step 2: Run full test suite with coverage**
```bash
npx jest --coverage
```
Expected: All PASS; utilities at high coverage

**Step 3: Verify on simulator**
```bash
npx expo start
```
Open in iOS Simulator. Check:
- [ ] Dark/light toggle works and persists
- [ ] Home tab: gauge shows ~20.3% in red (below 20% threshold), dam strip scrolls, inflow grid renders
- [ ] Dams tab: all 16 dams listed, sort chips work, tapping a dam navigates to detail
- [ ] Dam detail: image loads, glass overlay visible, back button works
- [ ] Trends tab: area chart renders, period chips filter data, year-over-year lines draw

**Step 4: Final commit**
```bash
git add .
git commit -m "feat: complete Cyprus Water app"
```
