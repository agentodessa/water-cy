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
| `tailwind.config.js` | Create | Color tokens, content paths, dark mode |
| `global.css` | Create | Tailwind directives, imported once in `_layout.tsx` |
| `metro.config.js` | Modify | Wrap with `withNativeWind({ input: './global.css' })` |
| `babel.config.js` | Modify | Add `nativewind/babel` to presets |
| `nativewind-env.d.ts` | Create | Triple-slash ref for className type support |

### Color token mapping

All tokens resolve via Tailwind built-ins where an exact match exists; only the two background tokens and the glassmorphism rgba values need custom treatment.

| Semantic token | Light | Dark | Tailwind class |
|---|---|---|---|
| background | `#F0F4F8` | `#0A0F1E` | `bg-[#F0F4F8] dark:bg-[#0A0F1E]` (custom hex in config) |
| surface | `#FFFFFF` | `#111827` | `bg-white dark:bg-gray-900` |
| text | `#0F172A` | `#F1F5F9` | `text-slate-900 dark:text-slate-100` |
| textSecondary | `#64748B` | `#94A3B8` | `text-slate-500 dark:text-slate-400` |
| accent | `#0EA5E9` | same | `text-sky-500` / `bg-sky-500` |
| danger | `#EF4444` | same | `text-red-500` / `bg-red-500` |
| warning | `#F59E0B` | same | `text-amber-500` / `bg-amber-500` |
| success | `#10B981` | same | `text-emerald-500` / `bg-emerald-500` |

**Glassmorphism rgba values** (`cardBorder`, `cardOverlay`, `card`) have no Tailwind equivalent at their specific alpha levels and remain as inline `style` props inside `GlassCard`.

### tailwind.config.js shape

```js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',   // NativeWind v5 uses class-based dark mode
  theme: {
    extend: {
      colors: {
        background: { light: '#F0F4F8', dark: '#0A0F1E' },
      },
    },
  },
};
```

---

## Section 2 — Theme System Replacement

### Files deleted
- `theme/ThemeContext.tsx`
- `theme/colors.ts`

### Replacement API

**Color scheme toggle** — `useColorScheme` from `nativewind`:

```ts
import { useColorScheme } from 'nativewind';
const { colorScheme, setColorScheme } = useColorScheme();
// toggle: setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
```

**Blur intensity** — computed inline where used (no hook needed):
```ts
const { colorScheme } = useColorScheme();
const blurIntensity = colorScheme === 'dark' ? 80 : 60;
```

**Fill color util** — `getFillColor(fraction)` in `lib/utils.ts` is replaced by two new exports:

```ts
// lib/utils.ts
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

### QueryClientProvider + ThemeProvider in _layout.tsx

`ThemeProvider` wrapper is removed. `_layout.tsx` only keeps `QueryClientProvider`. The `<StatusBar>` style is driven by `colorScheme`.

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

### `components/GlassCard.tsx`
- Add `className?: string` prop for layout overrides from callers
- Internal: `styles.blur` → `className="rounded-[20px] overflow-hidden"`
- Internal: `styles.overlay` → `className="rounded-[20px] border"`
- Glassmorphism rgba values (`backgroundColor: colors.cardOverlay`, `borderColor: colors.cardBorder`) remain inline — no Tailwind equivalent

### `components/FillBar.tsx`
- `styles.track` → `className="rounded-[3px] overflow-hidden w-full"`
- `styles.fill` → `className="rounded-[3px]"` + `style={{ width: \`${pct}%\`, height }}`
- Track background → `className="bg-white dark:bg-gray-900"`
- Fill color → `className={getFillBgClass(fraction)}` (replaces inline backgroundColor)

### `components/SystemGauge.tsx`
- `styles.card` → `className="m-4 items-center"`
- `styles.container` → `className="items-center justify-center"`
- `styles.centerText` → `className="absolute items-center"`
- `styles.pct` → `className="text-[36px] font-extrabold tracking-[-1px] ..."` + `className={getFillClass(pct)}`
- `styles.label` / `styles.date` → `className="... text-slate-500 dark:text-slate-400"`

### `components/DamCard.tsx`
- `styles.card` → `className="w-[110px] mr-2.5"` on the GlassCard
- `styles.name` → `className="text-xs font-semibold mb-1 text-slate-900 dark:text-slate-100"`
- `styles.pct` → `className="text-[18px] font-extrabold mb-1.5 ..."` + `className={getFillClass(pct)}`

### `components/DamRow.tsx`
- `styles.row` → `className="rounded-2xl p-3.5 mx-4 mb-2.5 bg-white dark:bg-gray-900"`
- `styles.top` / `styles.bottom` → `className="flex-row justify-between ..."`
- Name / pct text → `className="text-[15px] font-bold text-slate-900 dark:text-slate-100"`
- Sub text → `className="text-[11px] text-slate-500 dark:text-slate-400"`

### `components/Shimmer.tsx`
- Animated.View inline style: layout props (width/height/borderRadius) stay inline (dynamic); `backgroundColor` → NativeWind class not viable on Animated.View directly; use `className="bg-white dark:bg-gray-900"` with `cssInterop` or keep inline

### `app/(tabs)/index.tsx`
- All `styles.*` + color merges → className strings
- `paddingTop: insets.top + 12` stays `style={}`
- `paddingBottom: 100 + insets.bottom` stays `style={}`
- Inflow grid item: `className="w-[30%] rounded-xl p-2.5 bg-white dark:bg-gray-900"`

### `app/(tabs)/dams.tsx`
- All `styles.*` → className
- Sort chips: conditional `className` based on active sort

### `app/(tabs)/trends.tsx`
- All `styles.*` → className
- Victory chart style objects remain inline (chart lib ignores className)
- Year color chips: conditional className or inline for YEAR_COLORS array (these are data-driven non-semantic colors — keep inline)

### `app/(tabs)/_layout.tsx`
- Tab bar `tabBarStyle` / `tabBarLabelStyle` remain inline (passed to expo-router screenOptions, not a React Native View)
- Remove ThemeProvider import/usage

### `app/dam/[name].tsx`
- All `styles.*` → className
- Back button `top: insets.top + 8` stays `style={}`
- Overlay text colors (`#fff`, `rgba(255,255,255,0.7)`) → `text-white` / `text-white/70`
- Back button bg `rgba(0,0,0,0.4)` → `bg-black/40`

---

## Section 5 — What Stays Inline (Permanent Exceptions)

| Location | Value | Reason |
|---|---|---|
| All tab screens | `paddingBottom: 100 + insets.bottom` | Runtime safe-area value |
| All tab screens | `paddingTop: insets.top + N` | Runtime safe-area value |
| `dam/[name].tsx` | `top: insets.top + 8` | Runtime safe-area value |
| `GlassCard` | `cardOverlay` / `cardBorder` rgba | No Tailwind equivalent |
| `Shimmer` | `width`, `height`, `borderRadius` | Passed as props, dynamic |
| `trends.tsx` | Victory chart style objects | Chart lib ignores className |
| `trends.tsx` | YEAR_COLORS chips | Data-driven non-semantic colors |
| `FillBar` | `width: \`${pct}%\`` | Runtime percentage |

---

## Section 6 — Testing

No test changes required. Existing tests mock `expo-blur` and `react-native-reanimated`; they don't assert on StyleSheet values. Add `nativewind` to jest mocks if className-related assertions are added later.

Post-migration smoke check: run `npx jest` — all 10 tests should pass unchanged.
