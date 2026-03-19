# Alerts Tab — POC Design Spec

## Overview

Add a new "Alerts" tab to the Cyprus water app that displays real-time disaster alerts from GDACS (Global Disaster Alerting Coordination System), filtered to the Cyprus region. Alerts are grouped by severity (Red > Orange > Green) with user-configurable category filters and local push notifications for critical (Red) alerts.

## Data Source

**GDACS RSS Feed** — XML feed filtered to Cyprus bounding box (~34–36°N, 32–35°E with margin). Returns alerts with severity levels, event types, coordinates, and descriptions.

No API key required. Free and publicly available.

## Data Model

```ts
type AlertSeverity = 'Red' | 'Orange' | 'Green';
type AlertType = 'earthquake' | 'flood' | 'cyclone' | 'volcano' | 'drought' | 'security';

interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  date: number;          // ms epoch
  lat: number;
  lon: number;
  country: string;
  url: string;           // GDACS detail link
}
```

GDACS event type mapping: EQ → earthquake, FL → flood, TC → cyclone, VO → volcano, DR → drought.

## Data Layer

### `hooks/useAlerts.ts`

- Fetches GDACS RSS feed for Cyprus region
- Parses XML response using `fast-xml-parser`
- Normalizes into `Alert[]`
- TanStack Query hook with `staleTime: 30_000` and `refetchInterval: 30_000` (30-second polling)
- Filters results by user's enabled categories before returning

### `hooks/useAlertPreferences.ts`

- Stores user's enabled alert categories as `Set<AlertType>` in AsyncStorage
- Key: `alert-preferences`
- Default: all categories enabled (except `security` which is disabled/placeholder)
- Exposes `{ enabledTypes, toggleType, isEnabled }` API

## Notifications

### `hooks/useAlertNotifications.ts`

- Uses `expo-notifications` for local push notifications
- Requests notification permission on first visit to Alerts tab
- Tracks previously seen alert IDs in a `useRef<Set<string>>`
- When `useAlerts()` returns new data, compares against seen IDs
- Fires a local notification for any **new Red severity** alert only
- Notification includes: alert title, description, deep link to alerts tab
- Orange/Green alerts: in-app display only, no push notification

**Limitation (POC):** Notifications only fire when the app is open and polling detects a new Red alert. No background fetch.

## UI — Alerts Tab Screen

### Screen: `app/(tabs)/alerts.tsx`

**Layout (top to bottom):**

1. **Header** — "Alerts" title + "Cyprus · GDACS" subtitle
2. **Filter bar** — Horizontally scrollable chips for each alert type:
   - earthquake, flood, cyclone, volcano, drought, security
   - Tappable to toggle on/off
   - `security` chip present but disabled with "Coming soon" label
   - State persisted via `useAlertPreferences`
3. **Severity sections** — Three groups, each collapsible:
   - **Red** — red accent bar, bold styling, critical alerts
   - **Orange** — amber accent bar, warning alerts
   - **Green** — green accent bar, advisory alerts
   - Each shows count badge
   - Empty sections are hidden
4. **Alert card** — Inside `GlassCard`:
   - Severity badge (colored dot)
   - Alert type icon
   - Title + truncated description
   - Time ago label
   - Tappable → `Linking.openURL(alert.url)`
5. **Pull to refresh** — `RefreshControl`, 15-second cooldown (matches earthquakes pattern)
6. **Loading state** — `Shimmer` skeletons
7. **Empty state** — "No active alerts for Cyprus" when filters return nothing

**Tab icon:** SF Symbol `exclamationmark.triangle` / `exclamationmark.triangle.fill`

### Styling

- Follows existing NativeWind v5 patterns
- Dark/light mode via `useColorScheme` from `nativewind`
- Reuses `GlassCard` and `Shimmer` components
- Color scheme:
  - Red severity: `#EF4444`
  - Orange severity: `#F59E0B`
  - Green severity: `#10B981`

## New Dependencies

| Package | Purpose | Native code? |
|---------|---------|-------------|
| `fast-xml-parser` | XML→JSON parsing for GDACS RSS | No (pure JS) |
| `expo-notifications` | Local push notifications | Yes (Expo managed) |

## File Changes

### New files
- `hooks/useAlerts.ts` — GDACS fetch + parse + TanStack Query hook
- `hooks/useAlertPreferences.ts` — AsyncStorage-backed category filter preferences
- `hooks/useAlertNotifications.ts` — notification permission + firing logic
- `app/(tabs)/alerts.tsx` — Alerts tab screen

### Modified files
- `app/(tabs)/_layout.tsx` — add Alerts tab trigger
- `package.json` / `bun.lock` — add `fast-xml-parser`, `expo-notifications`

### No changes to
- Existing screens (Home, Dams, Trends, Calculator, Earthquakes)
- Existing components (`GlassCard`, `Shimmer`, `FillBar`, etc.)
- Root layout, theme, or API layer

## Out of Scope (POC)

- Background fetch / background notifications (`expo-task-manager`)
- Map view for alerts
- Security/missile alert category (no public data source — filter chip present but disabled)
- Sound/siren for critical alerts
- Alert history / persistence beyond query cache
- Localization (English only)
