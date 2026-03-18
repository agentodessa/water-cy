# NativeWind v5 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all StyleSheet-based styles to NativeWind v5 `className` strings with `dark:` variants, deleting `ThemeContext` and `colors.ts` entirely.

**Architecture:** Install NativeWind v5 + Tailwind v3, wire up metro/babel config, migrate components and screens file-by-file from bottom up (utilities → components → screens → layouts), update tests last, then delete the old theme files.

**Tech Stack:** NativeWind v5, Tailwind CSS v3, `nativewind/preset`, `useColorScheme` from `nativewind`, `cssInterop` from `nativewind` for `Animated.View` and `BlurView`.

---

## File Map

| File | Action |
|---|---|
| `tailwind.config.js` | Create |
| `global.css` | Create |
| `metro.config.js` | Create |
| `babel.config.js` | Modify |
| `nativewind-env.d.ts` | Create |
| `lib/utils.ts` | Create |
| `components/GlassCard.tsx` | Modify |
| `components/FillBar.tsx` | Modify |
| `components/Shimmer.tsx` | Modify |
| `components/DamCard.tsx` | Modify |
| `components/DamRow.tsx` | Modify |
| `components/SystemGauge.tsx` | Modify |
| `app/_layout.tsx` | Modify |
| `app/(tabs)/_layout.tsx` | Modify |
| `app/(tabs)/index.tsx` | Modify |
| `app/(tabs)/dams.tsx` | Modify |
| `app/(tabs)/trends.tsx` | Modify |
| `app/dam/[name].tsx` | Modify |
| `__tests__/theme.test.ts` | Modify |
| `__tests__/DamRow.test.tsx` | Modify |
| `__tests__/SystemGauge.test.tsx` | Modify |
| `theme/ThemeContext.tsx` | Delete |
| `theme/colors.ts` | Delete |

---

## Task 1: Install packages and create config files

**Files:**
- Create: `tailwind.config.js`
- Create: `global.css`
- Create: `metro.config.js`
- Modify: `babel.config.js`
- Create: `nativewind-env.d.ts`

- [ ] **Step 1: Install NativeWind v5 and Tailwind CSS v3**

```bash
npm install nativewind tailwindcss react-native-css-interop
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Create `tailwind.config.js`**

```js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts}',
  ],
  presets: [require('nativewind/preset')],
  // Note: do NOT set darkMode — nativewind/preset registers its own dark variant
  theme: {
    extend: {},
  },
};
```

- [ ] **Step 3: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create `metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 5: Update `babel.config.js`**

Replace the existing content:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Note: NativeWind v5 does NOT use a `nativewind/babel` preset (that was v4). The JSX transform is wired solely via `jsxImportSource: 'nativewind'` inside `babel-preset-expo`'s options.

- [ ] **Step 6: Create `nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js global.css metro.config.js babel.config.js nativewind-env.d.ts package.json package-lock.json
git commit -m "feat: install and configure NativeWind v5"
```

---

## Task 2: Create `lib/utils.ts` with fill class utilities

**Files:**
- Create: `lib/utils.ts`
- Modify: `__tests__/theme.test.ts`

- [ ] **Step 1: Update `__tests__/theme.test.ts` to test the new API**

Replace the entire file:

```ts
import { getFillBgClass, getFillClass } from '../lib/utils';

describe('getFillClass', () => {
  it('returns danger class for < 20%', () => {
    expect(getFillClass(0.1)).toBe('text-red-500');
    expect(getFillClass(0.199)).toBe('text-red-500');
  });
  it('returns warning class for 20–50%', () => {
    expect(getFillClass(0.2)).toBe('text-amber-500');
    expect(getFillClass(0.499)).toBe('text-amber-500');
  });
  it('returns success class for >= 50%', () => {
    expect(getFillClass(0.5)).toBe('text-emerald-500');
    expect(getFillClass(1.0)).toBe('text-emerald-500');
  });
});

describe('getFillBgClass', () => {
  it('returns danger bg class for < 20%', () => {
    expect(getFillBgClass(0.1)).toBe('bg-red-500');
  });
  it('returns warning bg class for 20–50%', () => {
    expect(getFillBgClass(0.2)).toBe('bg-amber-500');
  });
  it('returns success bg class for >= 50%', () => {
    expect(getFillBgClass(0.5)).toBe('bg-emerald-500');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/theme.test.ts
```

Expected: FAIL — `Cannot find module '../lib/utils'`

- [ ] **Step 3: Create `lib/utils.ts`**

```ts
export function getFillClass(fraction: number): string {
  if (fraction < 0.2) return 'text-red-500';
  if (fraction < 0.5) return 'text-amber-500';
  return 'text-emerald-500';
}

export function getFillBgClass(fraction: number): string {
  if (fraction < 0.2) return 'bg-red-500';
  if (fraction < 0.5) return 'bg-amber-500';
  return 'bg-emerald-500';
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx jest __tests__/theme.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts __tests__/theme.test.ts
git commit -m "feat: add getFillClass/getFillBgClass utilities"
```

---

## Task 3: Migrate `components/GlassCard.tsx`

**Files:**
- Modify: `components/GlassCard.tsx`

- [ ] **Step 1: Rewrite `components/GlassCard.tsx`**

```tsx
import { BlurView } from 'expo-blur';
import { cssInterop } from 'nativewind';
import { useColorScheme } from 'nativewind';
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
```

- [ ] **Step 2: Run tests to confirm nothing is broken**

```bash
npx jest
```

Expected: all tests that were passing still pass (theme.test.ts: 6 ✓, others unchanged)

- [ ] **Step 3: Commit**

```bash
git add components/GlassCard.tsx
git commit -m "feat: migrate GlassCard to NativeWind v5"
```

---

## Task 4: Migrate `components/FillBar.tsx`

**Files:**
- Modify: `components/FillBar.tsx`

- [ ] **Step 1: Rewrite `components/FillBar.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { getFillBgClass } from '../lib/utils';

/** percentage: fractional value 0.0–1.0 (e.g. 0.65 = 65%) */
interface FillBarProps {
  percentage: number;
  height?: number;
}

export function FillBar({ percentage, height = 6 }: FillBarProps) {
  const clampedPct = Math.min(Math.max(percentage * 100, 0), 100);
  return (
    <View className="rounded-[3px] overflow-hidden w-full bg-white dark:bg-gray-900" style={{ height }}>
      <View
        className={`rounded-[3px] ${getFillBgClass(percentage)}`}
        style={{ width: `${clampedPct}%`, height }}
      />
    </View>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 3: Commit**

```bash
git add components/FillBar.tsx
git commit -m "feat: migrate FillBar to NativeWind v5"
```

---

## Task 5: Migrate `components/Shimmer.tsx`

**Files:**
- Modify: `components/Shimmer.tsx`

- [ ] **Step 1: Rewrite `components/Shimmer.tsx`**

```tsx
import { cssInterop } from 'nativewind';
import React, { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

cssInterop(Animated.View, { className: 'style' });

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) {
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
      className="bg-white dark:bg-gray-900"
      style={[
        { width: width as DimensionValue, height, borderRadius },
        animStyle,
        style,
      ]}
    />
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npx jest
```

Expected: all passing. Note: `cssInterop(Animated.View, ...)` is called at module level. Under the Jest environment, `react-native-reanimated` is replaced with `react-native-reanimated/mock`. NativeWind's `cssInterop` is designed to be a no-op when the CSS interop runtime is absent (i.e., in tests), so this call is safe and will not throw. No additional Jest mock for `nativewind` is required.

- [ ] **Step 3: Commit**

```bash
git add components/Shimmer.tsx
git commit -m "feat: migrate Shimmer to NativeWind v5"
```

---

## Task 6: Migrate `components/DamCard.tsx`

**Files:**
- Modify: `components/DamCard.tsx`

- [ ] **Step 1: Rewrite `components/DamCard.tsx`**

```tsx
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
```

- [ ] **Step 2: Run tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 3: Commit**

```bash
git add components/DamCard.tsx
git commit -m "feat: migrate DamCard to NativeWind v5"
```

---

## Task 7: Migrate `components/DamRow.tsx` and update its test

**Files:**
- Modify: `components/DamRow.tsx`
- Modify: `__tests__/DamRow.test.tsx`

- [ ] **Step 1: Rewrite `components/DamRow.tsx`**

```tsx
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatMCM, formatPercentage } from '../lib/format';
import { getFillClass } from '../lib/utils';
import { FillBar } from './FillBar';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-[14px] p-3.5 mx-4 mb-2.5 bg-white dark:bg-gray-900"
    >
      <View className="flex-row justify-between mb-2">
        <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{name}</Text>
        <Text className={`text-[15px] font-bold ${getFillClass(percentage)}`}>{formatPercentage(percentage)}</Text>
      </View>
      <FillBar percentage={percentage} height={5} />
      <View className="flex-row justify-between mt-1.5">
        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{formatMCM(storageMCM)} stored</Text>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{formatMCM(capacityMCM)} capacity</Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Update `__tests__/DamRow.test.tsx`** — remove ThemeProvider wrapper and its dead mock

```tsx
import { render } from '@testing-library/react-native';
import React from 'react';
import { DamRow } from '../components/DamRow';

it('renders dam name and percentage', () => {
  const { getByText } = render(
    <DamRow
      name="Kouris"
      percentage={0.183}
      capacityMCM={115}
      storageMCM={21.09}
      onPress={() => {}}
    />
  );
  expect(getByText('Kouris')).toBeTruthy();
  expect(getByText('18.3%')).toBeTruthy();
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/DamRow.test.tsx
```

Expected: PASS (1 test)

- [ ] **Step 4: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add components/DamRow.tsx __tests__/DamRow.test.tsx
git commit -m "feat: migrate DamRow to NativeWind v5"
```

---

## Task 8: Migrate `components/SystemGauge.tsx` and update its test

**Files:**
- Modify: `components/SystemGauge.tsx`
- Modify: `__tests__/SystemGauge.test.tsx`

- [ ] **Step 1: Rewrite `components/SystemGauge.tsx`**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { formatPercentage } from '../lib/format';
import { getFillClass } from '../lib/utils';
import { GlassCard } from './GlassCard';
import { useColorScheme } from 'nativewind';

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

  // SVG stroke colors must be literal values — use colorScheme ternary
  const trackColor = colorScheme === 'dark' ? '#111827' : '#FFFFFF';
  // Fill color is data-driven; derive the hex from the fraction thresholds
  const fillColor = percentage < 0.2 ? '#EF4444' : percentage < 0.5 ? '#F59E0B' : '#10B981';

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
```

- [ ] **Step 2: Update `__tests__/SystemGauge.test.tsx`** — remove ThemeProvider and its dead mock

```tsx
import { render } from '@testing-library/react-native';
import React from 'react';
import { SystemGauge } from '../components/SystemGauge';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
    Path: () => null,
    Circle: () => null,
  };
});

it('renders percentage text', () => {
  const { getByText } = render(
    <SystemGauge percentage={0.203} date="Feb 27, 2026" />
  );
  expect(getByText('20.3%')).toBeTruthy();
  expect(getByText('Feb 27, 2026')).toBeTruthy();
});
```

- [ ] **Step 3: Run SystemGauge test**

```bash
npx jest __tests__/SystemGauge.test.tsx
```

Expected: PASS (1 test)

- [ ] **Step 4: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add components/SystemGauge.tsx __tests__/SystemGauge.test.tsx
git commit -m "feat: migrate SystemGauge to NativeWind v5"
```

---

## Task 9: Migrate `app/_layout.tsx` and `app/(tabs)/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rewrite `app/_layout.tsx`**

```tsx
import './global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Rewrite `app/(tabs)/_layout.tsx`**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const blurIntensity = isDark ? 80 : 60;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
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

- [ ] **Step 3: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx "app/(tabs)/_layout.tsx"
git commit -m "feat: migrate root and tab layouts to NativeWind v5"
```

---

## Task 10: Migrate `app/(tabs)/index.tsx`

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Rewrite `app/(tabs)/index.tsx`**

```tsx
import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { DamCard } from '../../components/DamCard';
import { Shimmer } from '../../components/Shimmer';
import { SystemGauge } from '../../components/SystemGauge';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';

export default function HomeScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { data: percentages, isLoading: loadingPct, refetch: refetchPct } = usePercentages();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useDateStatistics();
  const isLoading = loadingPct || loadingStats;

  const damEntries = percentages
    ? Object.entries(percentages.damNamesToPercentage).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { refetchPct(); refetchStats(); }}
          tintColor="#0EA5E9"
        />
      }
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Cyprus Water</Text>
        <TouchableOpacity
          onPress={() => setColorScheme(isDark ? 'light' : 'dark')}
          className="p-2"
        >
          <Text className="text-xl">{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Gauge */}
      {isLoading
        ? <Shimmer height={240} borderRadius={20} style={{ margin: 16 }} />
        : percentages
          ? <SystemGauge
              percentage={percentages.totalPercentage}
              date={percentages.date}
              totalCapacityInMCM={percentages.totalCapacityInMCM}
            />
          : null}

      {/* All Reservoirs strip */}
      <Text className="text-base font-bold px-4 mt-5 mb-2.5 text-slate-900 dark:text-slate-100">All Reservoirs</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} width={110} height={90} borderRadius={20} style={{ marginRight: 10 }} />
            ))
          : damEntries.map(([name, pct]) => (
              <DamCard key={name} name={name} percentage={pct} />
            ))}
      </ScrollView>

      {/* Today's Inflow grid */}
      {stats && (
        <>
          <Text className="text-base font-bold px-4 mt-5 mb-2.5 text-slate-900 dark:text-slate-100">Today's Inflow (MCM)</Text>
          <View className="flex-row flex-wrap px-3 gap-2">
            {Object.entries(stats.inflowInMCM)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([name, inflow]) => (
                <View key={name} className="w-[30%] rounded-xl p-2.5 bg-white dark:bg-gray-900">
                  <Text className="text-[10px] font-semibold mb-0.5 text-slate-500 dark:text-slate-400" numberOfLines={1}>{name}</Text>
                  <Text className="text-sm font-bold text-sky-500">{inflow.toFixed(3)}</Text>
                </View>
              ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: migrate Home screen to NativeWind v5"
```

---

## Task 11: Migrate `app/(tabs)/dams.tsx`

**Files:**
- Modify: `app/(tabs)/dams.tsx`

- [ ] **Step 1: Rewrite `app/(tabs)/dams.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamRow } from '../../components/DamRow';
import { Shimmer } from '../../components/Shimmer';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';

type SortKey = 'fill' | 'capacity' | 'name';

export default function DamsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
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
          pct:        percentages.damNamesToPercentage[dam.nameEn] ?? 0,
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
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { r1(); r2(); }}
          tintColor="#0EA5E9"
        />
      }
    >
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[22px] font-extrabold tracking-tight mb-3 text-slate-900 dark:text-slate-100">Reservoirs</Text>
        <View className="flex-row gap-2">
          {(['fill', 'capacity', 'name'] as SortKey[]).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setSort(key)}
              className={`px-3 py-1.5 rounded-full ${sort === key ? 'bg-sky-500' : 'bg-white dark:bg-gray-900'}`}
            >
              <Text className={`text-xs font-semibold ${sort === key ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
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
```

- [ ] **Step 2: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/dams.tsx"
git commit -m "feat: migrate Dams screen to NativeWind v5"
```

---

## Task 12: Migrate `app/(tabs)/trends.tsx`

**Files:**
- Modify: `app/(tabs)/trends.tsx`

- [ ] **Step 1: Rewrite `app/(tabs)/trends.tsx`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { useColorScheme } from 'nativewind';
import { Shimmer } from '../../components/Shimmer';
import { useMonthlyInflows } from '../../hooks/useMonthlyInflows';

type Period = '1Y' | '3Y' | '5Y' | 'ALL';
const PERIOD_YEARS: Record<Period, number | null> = { '1Y': 1, '3Y': 3, '5Y': 5, 'ALL': null };
const YEAR_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function TrendsScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('5Y');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const { data: inflows, isLoading, refetch } = useMonthlyInflows();
  const currentYear = new Date().getFullYear();
  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = 200;

  // Derived colors for chart lib (ignores className)
  const textSecondary = colorScheme === 'dark' ? '#94A3B8' : '#64748B';
  const axisStyle = {
    axis: { stroke: textSecondary },
    tickLabels: { fill: textSecondary, fontSize: 9 },
  };

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
  }, [availableYears, selectedYears.length]);

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

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0EA5E9" />}
    >
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Historical Trends</Text>
      </View>

      {/* Period filter */}
      <View className="flex-row gap-2 px-4 mb-4">
        {(['1Y', '3Y', '5Y', 'ALL'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            className={`px-3.5 py-[7px] rounded-full ${period === p ? 'bg-sky-500' : 'bg-white dark:bg-gray-900'}`}
          >
            <Text className={`text-[13px] font-semibold ${period === p ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Monthly inflows area chart */}
      <Text className="text-base font-bold px-4 mb-2.5 mt-2 text-slate-900 dark:text-slate-100">Monthly Inflows (MCM)</Text>
      {isLoading
        ? <Shimmer height={chartHeight} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View className="mx-4 rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-900">
            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis
                style={axisStyle}
                tickFormat={(t: number) => Math.round(t).toString()}
              />
              <VictoryAxis dependentAxis style={axisStyle} />
              <VictoryArea
                data={areaData}
                style={{ data: { fill: '#0EA5E933', stroke: '#0EA5E9', strokeWidth: 2 } }}
              />
            </VictoryChart>
          </View>
        )}

      {/* Year-over-year chart */}
      <Text className="text-base font-bold px-4 mb-2.5 mt-2 text-slate-900 dark:text-slate-100">Year-over-Year</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 10 }}>
        {availableYears.map((year) => {
          const idx = selectedYears.indexOf(year);
          const isSelected = idx >= 0;
          return (
            <TouchableOpacity
              key={year}
              onPress={() => toggleYear(year)}
              className="px-3.5 py-[7px] rounded-full"
              style={{ backgroundColor: isSelected ? YEAR_COLORS[idx % YEAR_COLORS.length] : (colorScheme === 'dark' ? '#111827' : '#FFFFFF') }}
            >
              <Text className={`text-[13px] font-semibold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{year}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading
        ? <Shimmer height={chartHeight} borderRadius={12} style={{ marginHorizontal: 16 }} />
        : (
          <View className="mx-4 rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-900">
            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryAxis
                style={axisStyle}
                tickFormat={(t: number) => MONTHS[t - 1] ?? String(t)}
              />
              <VictoryAxis dependentAxis style={axisStyle} />
              {yoyData.map(({ year, color, data }) => (
                <VictoryLine
                  key={year}
                  data={data}
                  style={{ data: { stroke: color, strokeWidth: 2 } }}
                />
              ))}
            </VictoryChart>
          </View>
        )}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/trends.tsx"
git commit -m "feat: migrate Trends screen to NativeWind v5"
```

---

## Task 13: Migrate `app/dam/[name].tsx`

**Files:**
- Modify: `app/dam/[name].tsx`

- [ ] **Step 1: Rewrite `app/dam/[name].tsx`**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FillBar } from '../../components/FillBar';
import { GlassCard } from '../../components/GlassCard';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { formatMCM, formatPercentage } from '../../lib/format';
import { getFillClass } from '../../lib/utils';

export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
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
      <View className="flex-1 items-center justify-center bg-[#F0F4F8] dark:bg-[#0A0F1E]">
        <Text className="text-slate-900 dark:text-slate-100">Loading…</Text>
      </View>
    );
  }

  const capacityMCM = dam.capacity / 1_000_000;

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
    >
      <View className="pb-10">
        {/* Image header */}
        <View className="relative">
          {dam.imageUrl
            ? <Image source={{ uri: dam.imageUrl }} className="w-full h-[260px]" resizeMode="cover" />
            : <View className="w-full h-[260px] bg-white dark:bg-gray-900" />}

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 rounded-full p-2 bg-black/40"
            style={{ top: insets.top + 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Glass overlay */}
          <GlassCard className="absolute bottom-4 left-4 right-4" padding={16}>
            <Text className="text-white text-[20px] font-extrabold mb-0.5">{dam.nameEn}</Text>
            <Text className={`text-[28px] font-extrabold mb-0.5 ${getFillClass(pct)}`}>{formatPercentage(pct)}</Text>
            <Text className="text-white/70 text-[13px] mb-2">{formatMCM(storageMCM)} / {formatMCM(capacityMCM)}</Text>
            <FillBar percentage={pct} height={6} />
          </GlassCard>
        </View>

        {/* Stats grid */}
        <View className="flex-row flex-wrap p-3 gap-2">
          {[
            { label: 'Height',       value: `${dam.height}m` },
            { label: 'Built',        value: `${dam.yearOfConstruction}` },
            { label: 'Inflow today', value: `${inflowMCM.toFixed(3)} MCM` },
            { label: 'Type',         value: dam.typeEl },
          ].map(stat => (
            <View key={stat.label} className="w-[47%] rounded-xl p-3 bg-white dark:bg-gray-900">
              <Text className="text-[11px] font-semibold mb-0.5 text-slate-500 dark:text-slate-400">{stat.label}</Text>
              <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* River info */}
        <View className="flex-row items-center gap-2 mx-4 rounded-xl p-3 mb-2 bg-white dark:bg-gray-900">
          <Ionicons name="water" size={16} color="#0EA5E9" />
          <Text className="text-[13px] text-slate-900 dark:text-slate-100">River: {dam.riverNameEl}</Text>
        </View>

        {/* Wikipedia link */}
        {dam.wikipediaUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(dam.wikipediaUrl)}
            className="mx-4 mt-2 border rounded-xl p-3 items-center"
            style={{ borderColor: '#0EA5E9' }}
          >
            <Text className="text-sm font-semibold text-sky-500">View on Wikipedia →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx jest
```

Expected: all passing

- [ ] **Step 3: Commit**

```bash
git add "app/dam/[name].tsx"
git commit -m "feat: migrate Dam detail screen to NativeWind v5"
```

---

## Task 14: Delete old theme files

**Files:**
- Delete: `theme/ThemeContext.tsx`
- Delete: `theme/colors.ts`

- [ ] **Step 1: Confirm no remaining imports of theme files**

```bash
grep -r "theme/ThemeContext\|theme/colors\|useTheme\|getFillColor" --include="*.ts" --include="*.tsx" app/ components/ lib/ __tests__/
```

Expected: zero matches. If any are found, fix them before proceeding.

- [ ] **Step 2: Delete theme files**

```bash
rm theme/ThemeContext.tsx theme/colors.ts
```

- [ ] **Step 3: Run all tests**

```bash
npx jest
```

Expected: all 10 tests passing, no import errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: delete ThemeContext and colors — NativeWind v5 migration complete"
```

---

## Task 15: Verify and final check

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Run full test suite one last time**

```bash
npx jest --verbose
```

Expected: 10 tests passing across 5 suites.

- [ ] **Step 3: Check no StyleSheet.create() or useTheme() references remain**

```bash
grep -r "StyleSheet\.create\|useTheme\|getFillColor\|from.*theme/" --include="*.ts" --include="*.tsx" app/ components/ lib/
```

Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify NativeWind v5 migration complete"
```
