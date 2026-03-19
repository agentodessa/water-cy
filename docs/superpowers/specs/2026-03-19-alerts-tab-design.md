# Alerts Tab — POC Design Spec

## Overview

Add a new "Alerts" tab to the Cyprus water app that displays real-time disaster alerts from GDACS (Global Disaster Alerting Coordination System), filtered to the Cyprus region. Alerts are grouped by severity (Red > Orange > Green) with user-configurable category filters and local push notifications for critical (Red) alerts.

## Data Source

**GDACS RSS Feed** — Global XML feed at `https://www.gdacs.org/xml/rss.xml`. The feed does **not** support server-side bounding-box filtering, so we fetch the full global feed and filter client-side by coordinates (Cyprus bbox: lat 34–36°N, lon 32–35°E, with ~1° margin).

No API key required. Free and publicly available. Feed updates roughly every 15–30 minutes.

### XML Structure & Field Mapping

Each `<item>` in the RSS feed contains standard RSS fields plus GDACS/GeoRSS namespace extensions:

| XML field | Maps to | Notes |
|-----------|---------|-------|
| `<guid>` | `id` | Unique alert identifier |
| `<gdacs:alertlevel>` | `severity` | "Red", "Orange", or "Green" |
| `<gdacs:eventtype>` | `type` | EQ, FL, TC, VO, DR |
| `<title>` | `title` | Alert headline |
| `<description>` | `description` | HTML description (strip tags) |
| `<gdacs:fromdate>` | `date` | Parse to ms epoch |
| `<georss:point>` | `lat`, `lon` | Space-separated "lat lon" string |
| `<gdacs:country>` | `country` | Country name |
| `<link>` | `url` | GDACS detail page |

## Data Model

```ts
type AlertSeverity = 'Red' | 'Orange' | 'Green';
type AlertType = 'earthquake' | 'flood' | 'cyclone' | 'volcano' | 'drought';

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
- TanStack Query hook with `staleTime: 5 * 60 * 1000` (5 min) and `refetchInterval: 10 * 60 * 1000` (10 min). GDACS updates every 15–30 min so more aggressive polling wastes bandwidth. Pull-to-refresh available for on-demand refresh.
- Filters results by user's enabled categories before returning

### `hooks/useAlertPreferences.ts`

- Stores user's enabled alert categories as `Set<AlertType>` in AsyncStorage
- Key: `alert-preferences`
- Default: all categories enabled
- Exposes `{ enabledTypes, toggleType, isEnabled }` API

## Notifications

### `hooks/useAlertNotifications.ts`

- Uses `expo-notifications` for local push notifications
- Requests notification permission on first visit to Alerts tab
- Tracks previously seen alert IDs in AsyncStorage (key: `seen-alert-ids`) to avoid re-notifying on app restart
- When `useAlerts()` returns new data, compares against seen IDs
- Fires a local notification for any **new Red severity** alert only
- Notification includes: alert title, description, deep link to alerts tab
- Orange/Green alerts: in-app display only, no push notification

**Limitations (POC):**
- Notifications only fire when the app is open and polling detects a new Red alert. No background fetch.
- `expo-notifications` requires plugin config in `app.json` (Android notification channel setup). Will be configured during implementation.

## UI — Alerts Tab Screen

### Screen: `app/(tabs)/alerts.tsx`

**Layout (top to bottom):**

1. **Header** — "Alerts" title + "Cyprus · GDACS" subtitle
2. **Filter bar** — Horizontally scrollable chips for each alert type:
   - earthquake, flood, cyclone, volcano, drought
   - Tappable to toggle on/off
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
8. **Error state** — `GlassCard` with error message + "Retry" button, using `isError`/`error` from TanStack Query

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
- `lib/timeAgo.ts` — extract shared `timeAgo` utility (currently duplicated in earthquakes screen)
- `hooks/useAlerts.ts` — GDACS fetch + parse + TanStack Query hook
- `hooks/useAlertPreferences.ts` — AsyncStorage-backed category filter preferences
- `hooks/useAlertNotifications.ts` — notification permission + firing logic
- `app/(tabs)/alerts.tsx` — Alerts tab screen

### Modified files
- `app/(tabs)/_layout.tsx` — add Alerts tab trigger (note: this brings tab count to 6; acceptable for POC, consider consolidating Earthquakes into Alerts in a future iteration since GDACS includes earthquake alerts)
- `app/(tabs)/earthquakes.tsx` — import `timeAgo` from shared `lib/timeAgo.ts`
- `package.json` / `bun.lock` — add `fast-xml-parser`, `expo-notifications`

### No changes to
- Existing screens (Home, Dams, Trends, Calculator, Earthquakes)
- Existing components (`GlassCard`, `Shimmer`, `FillBar`, etc.)
- Root layout, theme, or API layer

## Out of Scope (POC)

- Background fetch / background notifications (`expo-task-manager`)
- Map view for alerts
- Security/missile alert category (no public data source — can be added to `AlertType` union when a source is identified)
- Sound/siren for critical alerts
- Alert history / persistence beyond query cache
- Localization (English only)
