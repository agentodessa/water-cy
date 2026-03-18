# NativeWind v5 Migration — Design Spec

**Date:** 2026-03-19
**Status:** Approved
**Scope:** Migrate all StyleSheet-based styles to NativeWind v5, replacing the custom ThemeContext with NativeWind's built-in dark mode system.

---

## Goal

Replace every `StyleSheet.create()` call and `useTheme()` color reference with NativeWind v5 `className` strings and `dark:` variants. After migration, `ThemeContext.tsx` and `colors.ts` are deleted. The only surviving `style={}` props are for unavoidable runtime values.

---

## Section 1 — Setup & Configuration

### Packages to install

```
nativewind          (v5 — the stable release)
tailwindcss         (v3 — NativeWind v5 peer)
react-native-css-interop  (NativeWind v5 runtime dependency)
```

### New / modified config files

| File | Action | Purpose |
|---|---|---|
| `tailwind.config.js` | Create | Color tokens, content paths |
| `global.css` | Create | Tailwind directives, imported once in `_layout.tsx` |
| `metro.config.js` | Modify | Wrap with `withNativeWind({ input: './global.css' })` |
| `babel.config.js` | Modify | Add `nativewind/babel` to presets |
| `nativewind-env.d.ts` | Create | `/// <reference types="nativewind/types" />` |

### Color token mapping

All tokens resolve via Tailwind built-ins where an exact match exists; only the two background tokens and the glassmorphism rgba values need custom treatment.

| Semantic token | Light | Dark | Tailwind class |
|---|---|---|---|
| background | `#F0F4F8` | `#0A0F1E` | `bg-[#F0F4F8] dark:bg-[#0A0F1E]` |
| surface | `#FFFFFF` | `#111827` | `bg-white dark:bg-gray-900` |
| text | `#0F172A` | `#F1F5F9` | `text-slate-900 dark:text-slate-100` |
| textSecondary | `#64748B` | `#94A3B8` | `text-slate-500 dark:text-slate-400` |
| accent | `#0EA5E9` | same | `text-sky-500` / `bg-sky-500` |
| danger | `#EF4444` | same | `text-red-500` / `bg-red-500` |
| warning | `#F59E0B` | same | `text-amber-500` / `bg-amber-500` |
| success | `#10B981` | same | `text-emerald-500` / `bg-emerald-500` |

**Glassmorphism rgba values** (`cardBorder`, `cardOverlay`, `card`) have no Tailwind equivalent at their specific alpha levels and remain as inline `style` props inside `GlassCard` and `_layout.tsx`.

### tailwind.config.js shape

```js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts}',   // required: getFillClass strings must not be purged
  ],
  presets: [require('nativewind/preset')],
  // Note: do NOT set darkMode — nativewind/preset registers its own dark variant
  theme: {
    extend: {},
  },
};
```

---

## Section 2 — Theme System Replacement

### Files deleted
- `theme/ThemeContext.tsx`
- `theme/colors.ts`

### Replacement API

**Color scheme + toggle** — `useColorScheme` from `nativewind`:

```ts
import { useColorScheme } from 'nativewind';
const { colorScheme, setColorScheme } = useColorScheme();
// toggle: setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
```

The toggle button in `app/(tabs)/index.tsx` must replace `toggleTheme()` with this call.

**Blur intensity** — computed inline where used:
```ts
const { colorScheme } = useColorScheme();
const blurIntensity = colorScheme === 'dark' ? 80 : 60;
```

**Card border color in `_layout.tsx`** — `tabBarStyle` is a plain object passed to expo-router `screenOptions`; NativeWind `className` cannot be used. Replace with `useColorScheme` + ternary over literal rgba values:
```ts
borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)'
```

**`tintColor` on `RefreshControl`** — this prop accepts a color string directly, not className. Replace `tintColor={colors.accent}` with the literal `tintColor="#0EA5E9"` on all three tab screens.

**Victory chart inline style objects in `trends.tsx`** — chart lib ignores className. Replace `colors.accent` with `'#0EA5E9'` and `colors.textSecondary` with a ternary:
```ts
const { colorScheme } = useColorScheme();
const textSecondary = colorScheme === 'dark' ? '#94A3B8' : '#64748B';
// then use textSecondary in axisStyle, and '#0EA5E9' for accent
```

**Fill color util** — `getFillColor()` in `theme/colors.ts` is deleted. Two new exports go in `lib/utils.ts`:

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

### `_layout.tsx` provider cleanup

Remove `ThemeProvider` import and wrapper. Keep only `QueryClientProvider`. `<StatusBar>` style is driven by `colorScheme`.

---

## Section 3 — Component Migration Pattern

### Rule: StyleSheet → className

Every `StyleSheet.create()` block is deleted. Its values become inline `className` strings on the JSX element.

### Rule: color merge → dark: variant

```tsx
// before
<Text style={[styles.title, { color: colors.text }]} />
// after
<Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100" />
```

### Rule: conditional color → conditional className

```tsx
// before
<View style={[styles.chip, { backgroundColor: active ? colors.accent : colors.surface }]} />
// after
<View className={`px-3 py-1.5 rounded-full ${active ? 'bg-sky-500' : 'bg-white dark:bg-gray-900'}`} />
```

### Rule: getFillColor → getFillClass

```tsx
// before
<Text style={{ color: getFillColor(pct) }} />
// after
<Text className={getFillClass(pct)} />
```

### Rule: mixed static + runtime → className + style

```tsx
// before
<ScrollView
  style={[styles.container, { backgroundColor: colors.background }]}
  contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
/>
// after
<ScrollView
  className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
  contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
/>
```

---

## Section 4 — File-by-File Migration Plan

### `lib/utils.ts`
- Add `getFillClass(fraction)` and `getFillBgClass(fraction)` exports
- Existing `getFillColor(fraction)` is deleted

### `components/GlassCard.tsx`
- Add `className?: string` prop for layout overrides from callers
- `styles.blur` → `className="rounded-[20px] overflow-hidden"`
- `styles.overlay` → `className="rounded-[20px] border"`
- `backgroundColor: colors.cardOverlay` and `borderColor: colors.cardBorder` remain inline (rgba values, no Tailwind equivalent)
- Replace `useTheme()` with `useColorScheme()` for `blurIntensity`

### `components/FillBar.tsx`
- `styles.track` → `className="rounded-[3px] overflow-hidden w-full"`
- Track background → `className="bg-white dark:bg-gray-900"`
- `styles.fill` → `className={`rounded-[3px] ${getFillBgClass(fraction)}`}` + `style={{ width: \`${pct}%\`, height }}`
- Remove `useTheme()`, no color references remain

### `components/SystemGauge.tsx`
- `styles.card` → `className="m-4 items-center"`
- `styles.container` → `className="items-center justify-center"`
- `styles.centerText` → `className="absolute items-center"`
- `styles.pct` → `className={\`text-[36px] font-extrabold tracking-[-1px] ${getFillClass(pct)}\`}`
- `styles.label` / `styles.date` → `className="text-xs text-slate-500 dark:text-slate-400 ..."`
- Replace `useTheme()` with `useColorScheme()`

### `components/DamCard.tsx`
- `styles.card` → `className="w-[110px] mr-2.5"` on the GlassCard
- `styles.name` → `className="text-xs font-semibold mb-1 text-slate-900 dark:text-slate-100"`
- `styles.pct` → `className={\`text-[18px] font-extrabold mb-1.5 ${getFillClass(pct)}\`}`
- Remove `useTheme()`

### `components/DamRow.tsx`
- `styles.row` → `className="rounded-2xl p-3.5 mx-4 mb-2.5 bg-white dark:bg-gray-900"`
- `styles.top` → `className="flex-row justify-between mb-2"`
- `styles.bottom` → `className="flex-row justify-between mt-1.5"`
- Name / pct text → `className={\`text-[15px] font-bold ${getFillClass(pct)}\`}` / `text-slate-900 dark:text-slate-100`
- Sub text → `className="text-[11px] text-slate-500 dark:text-slate-400"`
- Remove `useTheme()`

### `components/Shimmer.tsx`
- Uses `Animated.View` from `react-native-reanimated`. NativeWind v5 does not apply `className` to reanimated's `Animated.View` without explicit wiring.
- At module level, add:
  ```ts
  import Animated from 'react-native-reanimated';
  import { cssInterop } from 'nativewind';
  cssInterop(Animated.View, { className: 'style' });
  ```
- Then `className="bg-white dark:bg-gray-900"` works. Width/height/borderRadius remain inline (passed as props).

### `app/_layout.tsx`
- Add `import './global.css'` — required for NativeWind to apply classes at runtime
- Remove `ThemeProvider` import and wrapper; keep only `QueryClientProvider`

### `app/(tabs)/_layout.tsx`
- Remove `ThemeProvider` import and wrapper
- Replace `useTheme()` with `useColorScheme()` from `nativewind`
- `tabBarStyle` and `tabBarLabelStyle` remain inline objects (passed to expo-router screenOptions)
- `borderTopColor` → ternary over literal rgba values (see Section 2)
- `tabBarActiveTintColor` → literal `'#0EA5E9'`
- `tabBarInactiveTintColor` → `colorScheme === 'dark' ? '#94A3B8' : '#64748B'`
- `backgroundColor: 'transparent'` can stay as-is

### `app/(tabs)/index.tsx`
- All `styles.*` + color merges → className strings
- Replace `useTheme()` with `useColorScheme()`
- Toggle button: `setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')`
- `tintColor="#0EA5E9"` (literal)
- `paddingTop: insets.top + 12` stays `style={}`
- `paddingBottom: 100 + insets.bottom` stays `style={}`
- Inflow grid item: `className="w-[30%] rounded-xl p-2.5 bg-white dark:bg-gray-900"`
- Inflow value text uses `colors.accent` → `className="text-sky-500"`

### `app/(tabs)/dams.tsx`
- All `styles.*` → className
- Replace `useTheme()` with `useColorScheme()`
- `tintColor="#0EA5E9"` (literal)
- Sort chips: conditional className based on active sort
- Shimmer: `className="mx-4 mb-2.5"` replaces inline style

### `app/(tabs)/trends.tsx`
- All `styles.*` → className
- Replace `useTheme()` with `useColorScheme()`
- `tintColor="#0EA5E9"` (literal)
- Victory chart style objects remain inline; replace `colors.accent` with `'#0EA5E9'` literal and `colors.textSecondary` with colorScheme ternary (see Section 2)
- YEAR_COLORS chips: keep inline `style` for chip background (data-driven non-semantic colors)

### `app/dam/[name].tsx`
- All `styles.*` → className
- Replace `useTheme()` with `useColorScheme()`
- Back button `top: insets.top + 8` stays `style={}`
- `contentContainerStyle={{ paddingBottom: 40 }}` → convert to `className` on a wrapper View (static value)
- Overlay text: `text-white` / `text-white/70`
- Back button bg: `className="bg-black/40"`
- `Ionicons` `color` prop: replace `colors.accent` with literal `'#0EA5E9'`; icon colors do not accept className
- Wiki button `borderColor` and wiki text `color`: replace `colors.accent` with literal `'#0EA5E9'` via inline `style` (border prop) and `className="text-sky-500"` (text)

---

## Section 5 — What Stays Inline (Permanent Exceptions)

| Location | Value | Reason |
|---|---|---|
| All tab screens | `paddingBottom: 100 + insets.bottom` | Runtime safe-area value |
| All tab screens | `paddingTop: insets.top + N` | Runtime safe-area value |
| `dam/[name].tsx` | `top: insets.top + 8` | Runtime safe-area value |
| `GlassCard` | `cardOverlay` / `cardBorder` rgba | No Tailwind equivalent |
| `_layout.tsx` | `tabBarStyle` / `tabBarLabelStyle` | expo-router screenOptions, not a View |
| `_layout.tsx` | `borderTopColor` rgba ternary | Same as above |
| `Shimmer` | `width`, `height`, `borderRadius` | Dynamic props |
| `trends.tsx` | Victory chart `data`/`axis` style objects | Chart lib ignores className |
| `trends.tsx` | YEAR_COLORS chips | Data-driven non-semantic colors |
| `FillBar` | `width: \`${pct}%\`` | Runtime percentage |

---

## Section 6 — Testing

Three test files require changes after the ThemeContext deletion:

| File | Change required |
|---|---|
| `__tests__/theme.test.ts` | Imports `getFillColor` from `../theme/colors` — update to import `getFillClass`/`getFillBgClass` from `../lib/utils` and update assertions |
| `__tests__/DamRow.test.tsx` | Imports `ThemeProvider` as wrapper — remove wrapper (NativeWind v5 needs no provider in tests); remove now-dead `@react-native-async-storage/async-storage` mock if it was only needed by `ThemeProvider` |
| `__tests__/SystemGauge.test.tsx` | Same as DamRow — remove `ThemeProvider` wrapper |

Add `nativewind` to jest mock list if className assertions are added later. For now no new mocks are required.

Post-migration smoke check: `npx jest` — all 10 tests should pass after the above updates.
