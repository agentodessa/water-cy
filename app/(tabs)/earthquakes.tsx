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
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from '../../components/Shimmer';
import { type Earthquake, useEarthquakes } from '../../hooks/useEarthquakes';
import { timeAgo } from '../../lib/timeAgo';

const REFRESH_COOLDOWN_MS = 15_000;

const CYPRUS = { latitude: 35.13, longitude: 33.43 };

function magColor(m: number): string {
  if (m < 2)  return '#10B981';
  if (m < 3)  return '#34D399';
  if (m < 4)  return '#F59E0B';
  if (m < 5)  return '#FB923C';
  if (m < 6)  return '#EF4444';
  return '#B91C1C';
}

function magLabel(m: number): string {
  if (m < 2)  return 'Micro';
  if (m < 3)  return 'Minor';
  if (m < 4)  return 'Light';
  if (m < 5)  return 'Moderate';
  if (m < 6)  return 'Strong';
  if (m < 7)  return 'Major';
  return 'Great';
}

function magLabelShort(m: number): string {
  if (m < 2)  return 'MICRO';
  if (m < 3)  return 'MINOR';
  if (m < 4)  return 'LIGHT';
  if (m < 5)  return 'MOD';
  if (m < 6)  return 'STRONG';
  if (m < 7)  return 'MAJOR';
  return 'GREAT';
}

function alphaHex(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

type ViewMode = 'map' | 'list';

export default function EarthquakesScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data, isLoading, refetch } = useEarthquakes();
  const lastRefreshAt = useRef(0);
  const [mode, setMode] = useState<ViewMode>('map');
  const insets = useSafeAreaInsets();

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAt.current = now;
    refetch();
  }, [refetch]);

  const header = (
    <>
      <View className="px-4 pb-2" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Earthquakes
        </Text>
        <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
          Mediterranean region · M2+ · last 200 events
        </Text>
      </View>

      {isLoading
        ? <Shimmer height={80} borderRadius={16} style={{ marginHorizontal: 16, marginTop: 4 }} />
        : data && <StatsCard data={data} isDark={isDark} />}

      <View className="px-4 pt-2 pb-2">
        <SegmentedControl mode={mode} onChange={setMode} isDark={isDark} />
      </View>
    </>
  );

  if (mode === 'map') {
    return (
      <View className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]">
        {header}
        <View className="flex-1 mx-4 mb-3 rounded-3xl overflow-hidden" style={{ marginBottom: insets.bottom + 12 }}>
          {isLoading ? (
            <Shimmer height={999} borderRadius={24} />
          ) : data ? (
            <EarthquakeMap data={data} isDark={isDark} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#0EA5E9" />
      }
    >
      {header}
      {isLoading ? (
        <>
          <Shimmer height={80} borderRadius={16} style={{ marginHorizontal: 16, marginBottom: 10 }} />
          <Shimmer height={80} borderRadius={16} style={{ marginHorizontal: 16, marginBottom: 10 }} />
          <Shimmer height={80} borderRadius={16} style={{ marginHorizontal: 16, marginBottom: 10 }} />
        </>
      ) : (
        <View className="px-4 pb-6" style={{ gap: 10 }}>
          {data?.map(eq => <EarthquakeCard key={eq.id} eq={eq} isDark={isDark} />)}
        </View>
      )}
      <View style={{ height: insets.bottom + 16 }} />
    </ScrollView>
  );
}

interface StatsCardProps {
  data: Earthquake[];
  isDark: boolean;
}

function StatsCard({ data, isDark }: StatsCardProps) {
  const maxMag   = data.length ? Math.max(...data.map(e => e.magnitude)) : 0;
  const recent24 = data.filter(e => Date.now() - e.time < 86_400_000).length;
  const strong   = data.filter(e => e.magnitude >= 4).length;

  const bg     = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const label  = isDark ? '#94A3B8' : '#64748B';

  return (
    <View
      className="mx-4"
      style={{ backgroundColor: bg, borderRadius: 16, borderWidth: 1, borderColor: border }}
    >
      <View className="flex-row" style={{ paddingVertical: 12 }}>
        <Stat label="Total"    value={String(data.length)}       color="#0EA5E9" labelColor={label} />
        <Divider isDark={isDark} />
        <Stat label="Last 24h" value={String(recent24)}          color="#10B981" labelColor={label} />
        <Divider isDark={isDark} />
        <Stat label="M4+"      value={String(strong)}            color="#F59E0B" labelColor={label} />
        <Divider isDark={isDark} />
        <Stat label="Max Mag"  value={maxMag.toFixed(1)}         color={magColor(maxMag)} labelColor={label} />
      </View>
    </View>
  );
}

function Stat({ label, value, color, labelColor }: { label: string; value: string; color: string; labelColor: string }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ fontSize: 22, fontWeight: '900', color, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: labelColor,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={{
        width: 1,
        marginVertical: 4,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
      }}
    />
  );
}

interface SegmentedControlProps {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  isDark: boolean;
}

function SegmentedControl({ mode, onChange, isDark }: SegmentedControlProps) {
  return (
    <View
      className="flex-row rounded-2xl p-1 self-start"
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)' }}
    >
      {(['map', 'list'] as ViewMode[]).map(m => {
        const active = mode === m;
        return (
          <TouchableOpacity
            key={m}
            activeOpacity={0.7}
            onPress={() => onChange(m)}
            className="px-5 py-2 rounded-xl"
            style={{ backgroundColor: active ? '#0EA5E9' : 'transparent' }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: active ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B') }}
            >
              {m === 'map' ? 'Map' : 'List'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EarthquakeMap({ data, isDark }: { data: Earthquake[]; isDark: boolean }) {
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ flex: 1 }}
      initialRegion={{ ...CYPRUS, latitudeDelta: 6, longitudeDelta: 6 }}
      userInterfaceStyle={isDark ? 'dark' : 'light'}
    >
      {data.map(eq => (
        <React.Fragment key={eq.id}>
          <Circle
            center={{ latitude: eq.lat, longitude: eq.lon }}
            radius={Math.pow(2, eq.magnitude) * 800}
            fillColor={magColor(eq.magnitude) + '30'}
            strokeColor={magColor(eq.magnitude) + '80'}
            strokeWidth={1}
          />
          <Marker
            coordinate={{ latitude: eq.lat, longitude: eq.lon }}
            tracksViewChanges={false}
          >
            <EqDot magnitude={eq.magnitude} />
            <Callout tooltip>
              <View
                className="rounded-2xl px-3 py-2"
                style={{ backgroundColor: isDark ? '#1E293B' : '#fff', minWidth: 180 }}
              >
                <Text className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  M{eq.magnitude.toFixed(1)} — {magLabel(eq.magnitude)}
                </Text>
                <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400" numberOfLines={2}>
                  {eq.place}
                </Text>
                <Text className="text-[11px] mt-1 text-slate-400">
                  {timeAgo(eq.time)} · {eq.depth.toFixed(0)} km deep
                </Text>
              </View>
            </Callout>
          </Marker>
        </React.Fragment>
      ))}
    </MapView>
  );
}

function EqDot({ magnitude }: { magnitude: number }) {
  const color = magColor(magnitude);
  const inner = magnitude < 3 ? 6 : magnitude < 5 ? 9 : 12;
  const size  = 20;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color,
        shadowOpacity: 0.7,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

interface EarthquakeCardProps {
  eq: Earthquake;
  isDark: boolean;
}

function EarthquakeCard({ eq, isDark }: EarthquakeCardProps) {
  const color = magColor(eq.magnitude);
  const bg    = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const title = isDark ? '#F1F5F9' : '#0F172A';
  const meta  = isDark ? '#94A3B8' : '#64748B';
  const dim   = isDark ? '#64748B' : '#94A3B8';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => eq.url && Linking.openURL(eq.url)}
      style={{
        backgroundColor: bg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: alphaHex(color, 0.2),
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          shadowColor: color,
          shadowOpacity: 0.4,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 22 }}>
          {eq.magnitude.toFixed(1)}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 8,
            fontWeight: '800',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: 0.4,
            marginTop: 1,
          }}
        >
          {magLabelShort(eq.magnitude)}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: title,
            letterSpacing: -0.2,
          }}
          numberOfLines={2}
        >
          {eq.place}
        </Text>
        <View className="flex-row items-center flex-wrap" style={{ marginTop: 4, gap: 6 }}>
          <Text style={{ fontSize: 11, color: meta, fontWeight: '600' }}>{timeAgo(eq.time)}</Text>
          <Text style={{ fontSize: 11, color: dim }}>·</Text>
          <Text style={{ fontSize: 11, color: meta }}>{eq.depth.toFixed(0)} km deep</Text>
          {eq.felt != null && eq.felt > 0 ? (
            <>
              <Text style={{ fontSize: 11, color: dim }}>·</Text>
              <Text style={{ fontSize: 11, color: meta }}>{eq.felt} felt</Text>
            </>
          ) : null}
          {eq.tsunami === 1 ? (
            <>
              <Text style={{ fontSize: 11, color: dim }}>·</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0EA5E9' }}>🌊 Tsunami</Text>
            </>
          ) : null}
        </View>
      </View>

      <Text style={{ fontSize: 22, color: dim, fontWeight: '300' }}>›</Text>
    </TouchableOpacity>
  );
}
