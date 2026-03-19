# Alerts Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GDACS-powered disaster alerts tab to the Cyprus water app with severity-grouped UI, category filters, and local push notifications for critical alerts.

**Architecture:** New tab (`alerts.tsx`) with three hooks: `useAlerts` (GDACS RSS fetch + parse), `useAlertPreferences` (AsyncStorage filter state), `useAlertNotifications` (expo-notifications for Red alerts). Follows existing patterns from the earthquakes tab.

**Tech Stack:** Expo SDK 55, TanStack Query v5, NativeWind v5, fast-xml-parser, expo-notifications, AsyncStorage

**Spec:** `docs/superpowers/specs/2026-03-19-alerts-tab-design.md`

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install fast-xml-parser and expo-notifications**

```bash
cd /Users/test/repos/pet/water-app
bun add fast-xml-parser expo-notifications
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/test/repos/pet/water-app
bun run --bun -e "require('fast-xml-parser'); console.log('fast-xml-parser OK')"
```

Expected: `fast-xml-parser OK`

- [ ] **Step 3: Add expo-notifications Jest mock and update transform patterns**

Add `expo-notifications` to `jest.config.js` transformIgnorePatterns (append `|expo-notifications` to the pattern). Then create a Jest mock file.

In `jest.config.js`, update the `transformIgnorePatterns` to include `expo-notifications`:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!.*node_modules).*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|victory-native|react-native-reanimated|react-native-worklets|expo-notifications)',
  ],
  setupFilesAfterEnv: [],
};
```

Create `__mocks__/expo-notifications.js`:

```js
module.exports = {
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-id')),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
};
```

- [ ] **Step 4: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add package.json bun.lock jest.config.js __mocks__/expo-notifications.js
git commit -m "chore: add fast-xml-parser and expo-notifications with Jest mock"
```

---

### Task 2: Extract Shared `timeAgo` Utility

**Files:**
- Create: `lib/timeAgo.ts`
- Modify: `app/(tabs)/earthquakes.tsx`
- Create: `__tests__/timeAgo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/timeAgo.test.ts`:

```ts
import { timeAgo } from '../lib/timeAgo';

describe('timeAgo', () => {
  it('returns "just now" for < 1 minute', () => {
    expect(timeAgo(Date.now() - 30_000)).toBe('just now');
  });

  it('returns minutes for < 1 hour', () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe('5m ago');
  });

  it('returns hours for < 1 day', () => {
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe('3h ago');
  });

  it('returns days for >= 1 day', () => {
    expect(timeAgo(Date.now() - 2 * 86_400_000)).toBe('2d ago');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/test/repos/pet/water-app
npx jest __tests__/timeAgo.test.ts
```

Expected: FAIL — `Cannot find module '../lib/timeAgo'`

- [ ] **Step 3: Write the implementation**

Create `lib/timeAgo.ts`:

```ts
export function timeAgo(ms: number): string {
  const diff  = Date.now() - ms;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/test/repos/pet/water-app
npx jest __tests__/timeAgo.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Update earthquakes.tsx to use shared utility**

In `app/(tabs)/earthquakes.tsx`:
- Add import: `import { timeAgo } from '../../lib/timeAgo';`
- Remove the local `timeAgo` function (lines 50-59)

- [ ] **Step 6: Run all tests to verify no regressions**

```bash
cd /Users/test/repos/pet/water-app
npx jest
```

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add lib/timeAgo.ts __tests__/timeAgo.test.ts app/(tabs)/earthquakes.tsx
git commit -m "refactor: extract shared timeAgo utility from earthquakes screen"
```

---

### Task 3: Alert Data Types & GDACS Fetch

**Files:**
- Create: `hooks/useAlerts.ts`
- Create: `__tests__/useAlerts.test.ts`

- [ ] **Step 1: Write the failing test for GDACS XML parsing**

Create `__tests__/useAlerts.test.ts`:

```ts
import { parseGdacsXml, type Alert } from '../hooks/useAlerts';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:gdacs="http://www.gdacs.org"
  xmlns:georss="http://www.georss.org/georss">
  <channel>
    <item>
      <guid>EQ1234</guid>
      <title>M 5.2 - Cyprus</title>
      <description>Earthquake near Limassol</description>
      <link>https://www.gdacs.org/report.aspx?eventid=1234</link>
      <gdacs:alertlevel>Orange</gdacs:alertlevel>
      <gdacs:eventtype>EQ</gdacs:eventtype>
      <gdacs:fromdate>2026-03-19T10:00:00Z</gdacs:fromdate>
      <gdacs:country>Cyprus</gdacs:country>
      <georss:point>34.7 33.0</georss:point>
    </item>
    <item>
      <guid>FL5678</guid>
      <title>Flood - Turkey</title>
      <description>Flash flooding in coastal areas</description>
      <link>https://www.gdacs.org/report.aspx?eventid=5678</link>
      <gdacs:alertlevel>Red</gdacs:alertlevel>
      <gdacs:eventtype>FL</gdacs:eventtype>
      <gdacs:fromdate>2026-03-18T08:30:00Z</gdacs:fromdate>
      <gdacs:country>Turkey</gdacs:country>
      <georss:point>40.0 30.0</georss:point>
    </item>
    <item>
      <guid>EQ9999</guid>
      <title>M 3.1 - Near Cyprus</title>
      <description>Minor earthquake</description>
      <link>https://www.gdacs.org/report.aspx?eventid=9999</link>
      <gdacs:alertlevel>Green</gdacs:alertlevel>
      <gdacs:eventtype>EQ</gdacs:eventtype>
      <gdacs:fromdate>2026-03-19T12:00:00Z</gdacs:fromdate>
      <gdacs:country>Cyprus</gdacs:country>
      <georss:point>35.0 33.5</georss:point>
    </item>
  </channel>
</rss>`;

describe('parseGdacsXml', () => {
  let alerts: Alert[];

  beforeAll(() => {
    alerts = parseGdacsXml(SAMPLE_XML);
  });

  it('filters to Cyprus bounding box only', () => {
    // Turkey item (lat 40) should be excluded
    expect(alerts).toHaveLength(2);
    expect(alerts.every(a => a.country === 'Cyprus')).toBe(true);
  });

  it('parses severity correctly', () => {
    expect(alerts[0].severity).toBe('Orange');
    expect(alerts[1].severity).toBe('Green');
  });

  it('maps event type codes to readable types', () => {
    expect(alerts[0].type).toBe('earthquake');
    expect(alerts[1].type).toBe('earthquake');
  });

  it('parses georss:point into lat/lon', () => {
    expect(alerts[0].lat).toBeCloseTo(34.7);
    expect(alerts[0].lon).toBeCloseTo(33.0);
  });

  it('parses date to ms epoch', () => {
    expect(typeof alerts[0].date).toBe('number');
    expect(alerts[0].date).toBeGreaterThan(0);
  });

  it('extracts title, description, url, country', () => {
    expect(alerts[0].title).toBe('M 5.2 - Cyprus');
    expect(alerts[0].description).toBe('Earthquake near Limassol');
    expect(alerts[0].url).toContain('gdacs.org');
    expect(alerts[0].country).toBe('Cyprus');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/test/repos/pet/water-app
npx jest __tests__/useAlerts.test.ts
```

Expected: FAIL — `Cannot find module '../hooks/useAlerts'`

- [ ] **Step 3: Write the implementation**

Create `hooks/useAlerts.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { XMLParser } from 'fast-xml-parser';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertSeverity = 'Red' | 'Orange' | 'Green';
export type AlertType = 'earthquake' | 'flood' | 'cyclone' | 'volcano' | 'drought';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  date: number;
  lat: number;
  lon: number;
  country: string;
  url: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Cyprus bbox with ~1° margin
const CYPRUS_BBOX = {
  minLat: 33,
  maxLat: 37,
  minLon: 31,
  maxLon: 36,
};

const EVENT_TYPE_MAP: Record<string, AlertType> = {
  EQ: 'earthquake',
  FL: 'flood',
  TC: 'cyclone',
  VO: 'volcano',
  DR: 'drought',
};

const GDACS_URL = 'https://www.gdacs.org/xml/rss.xml';

// ─── Parser ──────────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: false,
});

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').trim() ?? '';
}

export function parseGdacsXml(xml: string): Alert[] {
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  if (!items) return [];

  const itemArray = Array.isArray(items) ? items : [items];

  return itemArray
    .map((item: any) => {
      const point = item['georss:point'];
      if (!point) return null;

      const [lat, lon] = String(point).split(' ').map(Number);
      if (isNaN(lat) || isNaN(lon)) return null;

      // Filter to Cyprus bounding box
      if (lat < CYPRUS_BBOX.minLat || lat > CYPRUS_BBOX.maxLat) return null;
      if (lon < CYPRUS_BBOX.minLon || lon > CYPRUS_BBOX.maxLon) return null;

      const eventCode = item['gdacs:eventtype'] ?? '';
      const type = EVENT_TYPE_MAP[eventCode];
      if (!type) return null;

      const severity = item['gdacs:alertlevel'] as AlertSeverity;
      if (!['Red', 'Orange', 'Green'].includes(severity)) return null;

      const fromDate = item['gdacs:fromdate'];
      const date = fromDate ? new Date(fromDate).getTime() : 0;

      return {
        id: String(item.guid ?? ''),
        severity,
        type,
        title: String(item.title ?? ''),
        description: stripHtml(String(item.description ?? '')),
        date,
        lat,
        lon,
        country: String(item['gdacs:country'] ?? ''),
        url: String(item.link ?? ''),
      } satisfies Alert;
    })
    .filter((a): a is Alert => a !== null);
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(GDACS_URL);
  if (!res.ok) throw new Error(`GDACS error ${res.status}`);
  const xml = await res.text();
  return parseGdacsXml(xml);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAlerts(enabledTypes?: Set<AlertType>) {
  const query = useQuery({
    queryKey: ['gdacs-alerts'],
    queryFn: fetchAlerts,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const filtered = enabledTypes && query.data
    ? query.data.filter(a => enabledTypes.has(a.type))
    : query.data;

  return { ...query, data: filtered };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/test/repos/pet/water-app
npx jest __tests__/useAlerts.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add hooks/useAlerts.ts __tests__/useAlerts.test.ts
git commit -m "feat: add GDACS RSS fetch and XML parser for alerts"
```

---

### Task 4: Alert Preferences Hook

**Files:**
- Create: `hooks/useAlertPreferences.ts`
- Create: `__tests__/useAlertPreferences.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/useAlertPreferences.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { useAlertPreferences } from '../hooks/useAlertPreferences';
import type { AlertType } from '../hooks/useAlerts';

// AsyncStorage is auto-mocked by jest-expo setup
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

describe('useAlertPreferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults to all types enabled', () => {
    const { result } = renderHook(() => useAlertPreferences());
    expect(result.current.isEnabled('earthquake')).toBe(true);
    expect(result.current.isEnabled('flood')).toBe(true);
    expect(result.current.isEnabled('cyclone')).toBe(true);
    expect(result.current.isEnabled('volcano')).toBe(true);
    expect(result.current.isEnabled('drought')).toBe(true);
  });

  it('toggles a type off and on', () => {
    const { result } = renderHook(() => useAlertPreferences());

    act(() => result.current.toggleType('flood'));
    expect(result.current.isEnabled('flood')).toBe(false);

    act(() => result.current.toggleType('flood'));
    expect(result.current.isEnabled('flood')).toBe(true);
  });

  it('persists to AsyncStorage on toggle', () => {
    const { result } = renderHook(() => useAlertPreferences());
    act(() => result.current.toggleType('earthquake'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'alert-preferences',
      expect.any(String),
    );
  });

  it('exposes enabledTypes as a Set', () => {
    const { result } = renderHook(() => useAlertPreferences());
    expect(result.current.enabledTypes).toBeInstanceOf(Set);
    expect(result.current.enabledTypes.size).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/test/repos/pet/water-app
npx jest __tests__/useAlertPreferences.test.ts
```

Expected: FAIL — `Cannot find module '../hooks/useAlertPreferences'`

- [ ] **Step 3: Write the implementation**

Create `hooks/useAlertPreferences.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { AlertType } from './useAlerts';

const STORAGE_KEY = 'alert-preferences';

const ALL_TYPES: AlertType[] = ['earthquake', 'flood', 'cyclone', 'volcano', 'drought'];

export function useAlertPreferences() {
  const [enabledTypes, setEnabledTypes] = useState<Set<AlertType>>(new Set(ALL_TYPES));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        const arr = JSON.parse(raw) as AlertType[];
        setEnabledTypes(new Set(arr));
      }
    });
  }, []);

  const toggleType = useCallback((type: AlertType) => {
    setEnabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (type: AlertType) => enabledTypes.has(type),
    [enabledTypes],
  );

  return { enabledTypes, toggleType, isEnabled };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/test/repos/pet/water-app
npx jest __tests__/useAlertPreferences.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add hooks/useAlertPreferences.ts __tests__/useAlertPreferences.test.ts
git commit -m "feat: add alert preferences hook with AsyncStorage persistence"
```

---

### Task 5: Alert Notifications Hook

**Files:**
- Create: `hooks/useAlertNotifications.ts`

- [ ] **Step 1: Write the implementation**

Create `hooks/useAlertNotifications.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import type { Alert } from './useAlerts';

const SEEN_KEY = 'seen-alert-ids';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function loadSeenIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  return raw ? new Set(JSON.parse(raw)) : new Set();
}

async function saveSeenIds(ids: Set<string>) {
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export function useAlertNotifications(alerts: Alert[] | undefined) {
  const hasRequestedPermission = useRef(false);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // Load persisted seen IDs on mount
  useEffect(() => {
    loadSeenIds().then(ids => {
      seenIds.current = ids;
      initialized.current = true;
    });
  }, []);

  // Request permission once
  useEffect(() => {
    if (hasRequestedPermission.current) return;
    hasRequestedPermission.current = true;
    Notifications.requestPermissionsAsync();
  }, []);

  // Fire notifications for new Red alerts
  useEffect(() => {
    if (!alerts || !initialized.current) return;

    const newRedAlerts = alerts.filter(
      a => a.severity === 'Red' && !seenIds.current.has(a.id),
    );

    for (const alert of newRedAlerts) {
      seenIds.current.add(alert.id);
      Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 ${alert.title}`,
          body: alert.description,
          data: { url: alert.url },
        },
        trigger: { type: 'timeInterval', seconds: 1, repeats: false },
      });
    }

    // Mark all alerts as seen (not just Red)
    for (const alert of alerts) {
      seenIds.current.add(alert.id);
    }

    saveSeenIds(seenIds.current);
  }, [alerts]);
}
```

Note: This hook is side-effect heavy (notifications, AsyncStorage) and depends on `expo-notifications` native module. Testing it properly requires integration tests or manual verification. For the POC, we verify it works by running the app.

- [ ] **Step 2: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add hooks/useAlertNotifications.ts
git commit -m "feat: add alert notifications hook for Red severity alerts"
```

---

### Task 6: Alerts Tab Screen

**Files:**
- Create: `app/(tabs)/alerts.tsx`

- [ ] **Step 1: Write the screen**

Create `app/(tabs)/alerts.tsx`:

```tsx
import { useColorScheme } from 'nativewind';
import React, { useCallback, useRef, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { Shimmer } from '../../components/Shimmer';
import { timeAgo } from '../../lib/timeAgo';
import { type Alert, type AlertSeverity, type AlertType, useAlerts } from '../../hooks/useAlerts';
import { useAlertPreferences } from '../../hooks/useAlertPreferences';
import { useAlertNotifications } from '../../hooks/useAlertNotifications';

const REFRESH_COOLDOWN_MS = 15_000;

// ─── Severity config ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
  Red:    { color: '#EF4444', bg: '#EF444418', label: 'Critical' },
  Orange: { color: '#F59E0B', bg: '#F59E0B18', label: 'Warning' },
  Green:  { color: '#10B981', bg: '#10B98118', label: 'Advisory' },
};

const SEVERITY_ORDER: AlertSeverity[] = ['Red', 'Orange', 'Green'];

// ─── Alert type config ───────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AlertType, { icon: string; label: string }> = {
  earthquake: { icon: '🌍', label: 'Earthquake' },
  flood:      { icon: '🌊', label: 'Flood' },
  cyclone:    { icon: '🌀', label: 'Cyclone' },
  volcano:    { icon: '🌋', label: 'Volcano' },
  drought:    { icon: '☀️', label: 'Drought' },
};

const ALL_TYPES: AlertType[] = ['earthquake', 'flood', 'cyclone', 'volcano', 'drought'];

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({
  type,
  enabled,
  onToggle,
}: {
  type: AlertType;
  enabled: boolean;
  onToggle: () => void;
}) {
  const config = TYPE_CONFIG[type];
  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full mr-2 ${
        enabled ? 'bg-sky-500' : 'bg-slate-200 dark:bg-white/10'
      }`}
    >
      <Text className="text-[13px]">{config.icon}</Text>
      <Text className={`text-[12px] font-semibold ${
        enabled ? 'text-white' : 'text-slate-500 dark:text-slate-400'
      }`}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Alert row ───────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: Alert }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const sev = SEVERITY_CONFIG[alert.severity];
  const typeConfig = TYPE_CONFIG[alert.type];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => alert.url && Linking.openURL(alert.url)}
      className={`flex-row items-center gap-3 px-4 py-3 border-b ${
        isDark ? 'border-white/5' : 'border-black/5'
      }`}
    >
      {/* Severity + type badge */}
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{ backgroundColor: sev.bg }}
      >
        <Text className="text-[20px]">{typeConfig.icon}</Text>
      </View>

      <View className="flex-1">
        <Text
          className="text-[13px] font-semibold text-slate-800 dark:text-slate-100"
          numberOfLines={2}
        >
          {alert.title}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sev.color }} />
          <Text className="text-[11px] font-bold" style={{ color: sev.color }}>
            {sev.label}
          </Text>
          <Text className="text-[11px] text-slate-400">·</Text>
          <Text className="text-[11px] text-slate-400">{timeAgo(alert.date)}</Text>
        </View>
        {alert.description ? (
          <Text
            className="text-[11px] mt-0.5 text-slate-400"
            numberOfLines={1}
          >
            {alert.description}
          </Text>
        ) : null}
      </View>

      <Text className="text-slate-300 dark:text-slate-600 text-base">›</Text>
    </TouchableOpacity>
  );
}

// ─── Severity section ────────────────────────────────────────────────────────

function SeveritySection({
  severity,
  alerts,
}: {
  severity: AlertSeverity;
  alerts: Alert[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sev = SEVERITY_CONFIG[severity];

  if (alerts.length === 0) return null;

  return (
    <GlassCard className="mx-4 mt-3 overflow-hidden" padding={0}>
      <TouchableOpacity
        onPress={() => setCollapsed(c => !c)}
        className="flex-row items-center px-4 py-3"
      >
        <View className="w-3 h-full rounded-full mr-3" style={{ backgroundColor: sev.color }} />
        <Text className="text-[15px] font-bold text-slate-800 dark:text-slate-100 flex-1">
          {sev.label}
        </Text>
        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: sev.bg }}>
          <Text className="text-[12px] font-bold" style={{ color: sev.color }}>
            {alerts.length}
          </Text>
        </View>
        <Text className="text-slate-400 ml-2 text-base">{collapsed ? '▸' : '▾'}</Text>
      </TouchableOpacity>

      {!collapsed && alerts.map(a => <AlertRow key={a.id} alert={a} />)}
    </GlassCard>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const prefs = useAlertPreferences();
  const { data, isLoading, isError, error, refetch } = useAlerts(prefs.enabledTypes);
  const lastRefreshAt = useRef(0);
  const insets = useSafeAreaInsets();

  // Fire notifications for new Red alerts
  useAlertNotifications(data);

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAt.current = now;
    refetch();
  }, [refetch]);

  // Group alerts by severity
  const grouped = SEVERITY_ORDER.reduce(
    (acc, sev) => {
      acc[sev] = (data?.filter(a => a.severity === sev) ?? []).sort((a, b) => b.date - a.date);
      return acc;
    },
    {} as Record<AlertSeverity, Alert[]>,
  );

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#0EA5E9" />
      }
    >
      {/* Header */}
      <View className="px-4 pt-3 pb-2" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Alerts
        </Text>
        <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
          Cyprus · GDACS
        </Text>
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mt-1"
      >
        {ALL_TYPES.map(type => (
          <FilterChip
            key={type}
            type={type}
            enabled={prefs.isEnabled(type)}
            onToggle={() => prefs.toggleType(type)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <>
          <Shimmer height={120} borderRadius={20} style={{ margin: 16, marginTop: 12 }} />
          <Shimmer height={120} borderRadius={20} style={{ margin: 16, marginTop: 0 }} />
          <Shimmer height={80} borderRadius={20} style={{ margin: 16, marginTop: 0 }} />
        </>
      ) : isError ? (
        <GlassCard className="mx-4 mt-3">
          <Text className="text-[14px] font-semibold text-red-500 mb-2">
            Failed to load alerts
          </Text>
          <Text className="text-[12px] text-slate-400 mb-3">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-sky-500 self-start px-4 py-2 rounded-xl"
          >
            <Text className="text-white text-[13px] font-bold">Retry</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : data && data.length === 0 ? (
        <GlassCard className="mx-4 mt-3">
          <Text className="text-[14px] text-slate-500 dark:text-slate-400 text-center">
            No active alerts for Cyprus
          </Text>
        </GlassCard>
      ) : (
        SEVERITY_ORDER.map(sev => (
          <SeveritySection key={sev} severity={sev} alerts={grouped[sev]} />
        ))
      )}

      <View className="h-6" />
    </ScrollView>
  );
}
```

- [ ] **Step 2: Verify the screen compiles (type check)**

```bash
cd /Users/test/repos/pet/water-app
npx tsc --noEmit --pretty
```

Expected: No type errors in new files (existing errors in unrelated files are OK)

- [ ] **Step 3: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add app/(tabs)/alerts.tsx
git commit -m "feat: add Alerts tab screen with severity-grouped UI"
```

---

### Task 7: Add Alerts Tab to Navigation

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add the Alerts tab trigger**

In `app/(tabs)/_layout.tsx`, add a new `NativeTabs.Trigger` for alerts **before** the calculator trigger (so it's the 4th tab). Insert between the `trends` and `calculator` triggers:

```tsx
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: 'exclamationmark.triangle', selected: 'exclamationmark.triangle.fill' }} />
        <NativeTabs.Trigger.Label>Alerts</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
```

- [ ] **Step 2: Run all tests to check for regressions**

```bash
cd /Users/test/repos/pet/water-app
npx jest
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
cd /Users/test/repos/pet/water-app
git add app/(tabs)/_layout.tsx
git commit -m "feat: add Alerts tab to navigation"
```

---

### Task 8: Manual Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/test/repos/pet/water-app
npx expo start
```

- [ ] **Step 2: Verify on device/simulator**

Check the following:
1. Alerts tab appears in tab bar with triangle icon
2. Filter chips render and are tappable (toggle on/off)
3. If GDACS has active alerts near Cyprus, they appear grouped by severity
4. If no alerts, "No active alerts for Cyprus" empty state shows
5. Pull to refresh works
6. Tapping an alert opens the GDACS detail page
7. Notification permission prompt appears on first visit
8. Dark mode works correctly (toggle device theme)

- [ ] **Step 3: Run full test suite one final time**

```bash
cd /Users/test/repos/pet/water-app
npx jest
```

Expected: All tests pass
