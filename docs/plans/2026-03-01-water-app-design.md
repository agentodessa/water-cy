# Cyprus Water App — Design Document
**Date:** 2026-03-01
**Status:** Approved

---

## Overview

A React Native (Expo) app displaying water reservoir data for Cyprus, sourced from the Cyprus Water API at `https://cyprus-water.appspot.com/api`. Targets iOS and Android with a charts-first UX serving both general public and informed enthusiasts. Features dark/light theming and a liquid glass visual design.

---

## Architecture

### Tech Stack

| Concern | Library |
|---|---|
| Framework | Expo (managed workflow) |
| Routing | `expo-router` (file-based) |
| Language | TypeScript |
| Data fetching | `@tanstack/react-query` |
| Charts | `victory-native` |
| Theming | React Context + `useColorScheme` |
| Liquid glass | `expo-blur` (`BlurView`) |
| Animations | `react-native-reanimated` |
| Storage | `@react-native-async-storage/async-storage` |

### Directory Structure

```
app/
  (tabs)/
    index.tsx          ← Home tab (dashboard)
    dams.tsx           ← Dams tab (list)
    trends.tsx         ← Trends tab (historical charts)
  dam/[name].tsx       ← Dam detail screen
components/
  GlassCard.tsx        ← Reusable BlurView glass card
  SystemGauge.tsx      ← Animated radial gauge
  DamRow.tsx           ← Dam list row with fill bar
  DamCard.tsx          ← Horizontal scroll card
  FillBar.tsx          ← Colored fill progress bar
  Shimmer.tsx          ← Loading skeleton
hooks/
  usePercentages.ts    ← /api/percentages, staleTime: 5min
  useDams.ts           ← /api/dams, staleTime: 1day
  useDateStatistics.ts ← /api/date-statistics
  useMonthlyInflows.ts ← /api/monthly-inflows, staleTime: 1day
  useEvents.ts         ← /api/events
theme/
  colors.ts            ← Light + dark color tokens
  ThemeContext.tsx      ← Provider + useTheme hook
lib/
  api.ts               ← Typed fetch client for all endpoints
```

---

## Navigation

Three-tab layout using `expo-router`:

- **Home** (`/`) — scrollable dashboard, general public landing point
- **Dams** (`/dams`) — full list of all 16 dams, sortable, tappable to detail
- **Trends** (`/trends`) — historical charts with period filters

Dam detail is a stack screen pushed from the Dams tab: `/dam/[name]`

---

## Screens

### Home Tab
- Header with app title and dark/light toggle
- **Hero glass card**: animated radial gauge showing total system % (currently ~20%), date label
- **Top reservoirs strip**: horizontal scroll of small glass cards, each showing dam name + fill % bar
- **Recent trend section**: sparkline chart of total system % over last 12 months
- **Latest inflow section**: bar chart of per-dam inflow for most recent date

### Dams Tab
- Sort control (by fill %, by capacity, alphabetical) + search
- Scrollable list of all 16 dams as `DamRow` components
- Each row: name, fill % with colored bar, storage in MCM / total capacity
- Tapping a row pushes Dam Detail screen

### Trends Tab
- Period filter chips: 1Y / 3Y / 5Y / All
- **Monthly Inflows area chart**: full-width, 2009–2026 data
- **Year-over-year overlay**: multi-line chart, user selects years to compare

### Dam Detail Screen
- Full-bleed dam image header
- Liquid glass overlay on image: fill %, storage in MCM / total
- Static stats: height, year of construction, river name, type
- Line chart: storage over available dates for this dam
- Wikipedia link if available

---

## Data Layer (TanStack Query)

| Hook | Endpoint | Stale Time | Notes |
|---|---|---|---|
| `usePercentages()` | `/api/percentages` | 5 min | Primary source for fill levels |
| `useDams()` | `/api/dams` | 1 day | Static metadata |
| `useDateStatistics(date?)` | `/api/date-statistics` | 5 min | Storage + inflow per dam |
| `useMonthlyInflows()` | `/api/monthly-inflows` | 1 day | Historical data 2009–2026 |
| `useEvents()` | `/api/events` | 1 day | Event log |

- `gcTime: 24h` on all queries — keeps data available offline for a full day
- `refetchOnWindowFocus: true` — background refresh when user returns to app
- Pull-to-refresh on all tabs calls `refetch()` on the tab's relevant queries

---

## Theme System

### Color Tokens

```
Token           Light                   Dark
───────────────────────────────────────────────────
background      #F0F4F8                 #0A0F1E
surface         #FFFFFF                 #111827
card (glass)    rgba(255,255,255,0.7)   rgba(255,255,255,0.08)
text primary    #0F172A                 #F1F5F9
text secondary  #64748B                 #94A3B8
accent          #0EA5E9  (sky blue — water theme)
danger          #EF4444  (fill < 20%)
warning         #F59E0B  (fill 20–50%)
success         #10B981  (fill > 50%)
```

### Dark/Light Switching
- Reads `useColorScheme()` on first launch (follows system preference)
- User can override via toggle in Home header
- Override persists to `AsyncStorage`
- `ThemeContext` provides the active color set and blur intensity to all components

### Fill Level Color Coding
Applied to progress bars, gauge arc, and fill percentage text:
- `< 20%` → `danger` red (critical — Cyprus is currently at this threshold)
- `20–50%` → `warning` amber (caution)
- `> 50%` → `success` green (healthy)

---

## Liquid Glass Design

- **Component**: `GlassCard` wraps `BlurView` with:
  - Blur intensity: 60 (light) / 80 (dark)
  - Semi-transparent overlay: `rgba(255,255,255,0.12)` light / `rgba(0,0,0,0.3)` dark
  - 1px border: `rgba(255,255,255,0.3)` — simulates glass edge highlight
  - Border radius: 20px
- **Applied to**: Hero card, dam strip cards, tab bar background, dam detail image overlay
- **Fallback**: On Android where `BlurView` may be limited, the overlay color provides the frosted appearance without native blur

---

## Loading, Error & Empty States

### Loading
- Animated shimmer skeleton on hero card while data fetches
- Staggered shimmer on dam strip cards (feels alive, not frozen)
- Pulsing placeholder bars in charts
- All animations via `react-native-reanimated` at 60fps

### Errors
- Toast-style banner: "Couldn't reach Cyprus Water API — showing cached data"
- Errors are isolated per query — partial failures don't break the whole app
- Stale badge on hero card if data is >24h old

### Refresh
- Pull-to-refresh on all three tabs
- Background refetch on app foreground
