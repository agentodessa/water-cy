# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server
npx expo start

# Run tests (all)
npx jest

# Run a single test file
npx jest __tests__/SystemGauge.test.tsx

# Run tests matching a pattern
npx jest --testNamePattern="FillBar"

# iOS / Android
npx expo run:ios
npx expo run:android
```

There is no lint script configured. TypeScript checking is done via `tsc --noEmit` if needed.

## Architecture

**Navigation** — `expo-router` file-based routing. Root layout at `app/_layout.tsx` wraps everything in `QueryClientProvider` + `ThemeProvider`. Tabs live under `app/(tabs)/`. Dynamic dam detail at `app/dam/[name].tsx`.

**Data layer** — All server state is TanStack Query v5. API functions live in `lib/api.ts` (typed interfaces there too). Hooks in `hooks/` wrap `useQuery` with appropriate `staleTime`/`gcTime`. Dam capacity from the API is in raw m³ — divide by 1,000,000 for MCM display.

**Theme** — `theme/ThemeContext.tsx` exports `useTheme()` → `{ isDark, colors, blurIntensity, toggleTheme }`. Color tokens are in `theme/colors.ts`. `getFillColor(fraction)` (0.0–1.0) returns danger/warning/success. **Always consume theme via `useTheme()`**, never hardcode colors.

**Glass/blur UI** — `GlassCard` wraps `expo-blur` BlurView (intensity 60 light / 80 dark). Use it for any card-style surface.

**Charts** — `victory-native@36.9.2` with `react-native-svg`. Used in Trends tab for area + line charts.

**Animations** — `react-native-reanimated@4.x` with `react-native-worklets`. `Shimmer` uses reanimated for skeleton loading.

## Testing

Tests live in `__tests__/`. The jest preset is `jest-expo`. Key mocks required for components:
- `expo-blur` — mock BlurView
- `react-native-reanimated/mock`
- `react-native-svg`
- `@react-native-async-storage/async-storage`

The `transformIgnorePatterns` in `jest.config.js` already handles transpiling `victory-native`, `react-native-reanimated`, and `react-native-worklets`.
