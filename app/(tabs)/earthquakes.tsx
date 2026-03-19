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
import MapView, { Circle, Callout, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { Shimmer } from '../../components/Shimmer';
import { type Earthquake, useEarthquakes } from '../../hooks/useEarthquakes';
import { timeAgo } from '../../lib/timeAgo';

const REFRESH_COOLDOWN_MS = 15_000;

// Cyprus centre
const CYPRUS = { latitude: 35.13, longitude: 33.43 };

function magColor(m: number): string {
  if (m < 2)  return '#10B981';
  if (m < 3)  return '#34D399';
  if (m < 4)  return '#F59E0B';
  if (m < 5)  return '#FB923C';
  if (m < 6)  return '#EF4444';
  return '#B91C1C';
}

function magBg(m: number): string {
  if (m < 2)  return '#10B98118';
  if (m < 3)  return '#34D39918';
  if (m < 4)  return '#F59E0B18';
  if (m < 5)  return '#FB923C18';
  if (m < 6)  return '#EF444418';
  return '#B91C1C18';
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

// ─── Stats card (shared between both views) ───────────────────────────────────
function StatsCard({ data }: { data: Earthquake[] }) {
  const stats = {
    total:    data.length,
    maxMag:   Math.max(...data.map(e => e.magnitude)),
    recent24: data.filter(e => Date.now() - e.time < 86_400_000).length,
    strong:   data.filter(e => e.magnitude >= 4).length,
  };
  return (
    <GlassCard className="mx-4 mt-1">
      <View className="flex-row">
        {[
          { label: 'Total',    value: stats.total,              color: '#0EA5E9' },
          { label: 'Last 24h', value: stats.recent24,           color: '#10B981' },
          { label: 'M4+',      value: stats.strong,             color: '#F59E0B' },
          { label: 'Max Mag',  value: stats.maxMag.toFixed(1),  color: magColor(stats.maxMag) },
        ].map(s => (
          <View key={s.label} className="flex-1 items-center">
            <Text className="text-[22px] font-black" style={{ color: s.color }}>
              {s.value}
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── Segment control ──────────────────────────────────────────────────────────
function SegmentControl({
  value,
  onChange,
}: {
  value: 'map' | 'list';
  onChange: (v: 'map' | 'list') => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View className={`flex-row mx-4 mt-3 rounded-2xl p-1 ${isDark ? 'bg-white/10' : 'bg-black/8'}`}>
      {(['map', 'list'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          className={`flex-1 py-2 rounded-xl items-center ${value === tab ? 'bg-sky-500' : ''}`}
        >
          <Text className={`text-[13px] font-bold ${value === tab ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {tab === 'map' ? '🗺  Map' : '☰  List'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Custom marker ────────────────────────────────────────────────────────────
function EqMarker({ magnitude }: { magnitude: number }) {
  const color = magColor(magnitude);
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Badge */}
      <View style={{
        backgroundColor: color,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 5,
        minWidth: 44,
        alignItems: 'center',
        shadowColor: color,
        shadowOpacity: 0.6,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
      }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', lineHeight: 18 }}>
          {magnitude.toFixed(1)}
        </Text>
        <Text style={{ color: '#fff', fontSize: 7, fontWeight: '700', letterSpacing: 0.5, opacity: 0.9 }}>
          {magLabel(magnitude).toUpperCase()}
        </Text>
      </View>
      {/* Pointer triangle */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: color,
      }} />
    </View>
  );
}

// ─── Map view ─────────────────────────────────────────────────────────────────
function EarthquakeMap({ data }: { data: Earthquake[] }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ flex: 1 }}
        initialRegion={{
          ...CYPRUS,
          latitudeDelta:  6,
          longitudeDelta: 6,
        }}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {data.map(eq => (
          <React.Fragment key={eq.id}>
            {/* Pulsing circle sized by magnitude */}
            <Circle
              center={{ latitude: eq.lat, longitude: eq.lon }}
              radius={Math.pow(2, eq.magnitude) * 800}
              fillColor={magColor(eq.magnitude) + '30'}
              strokeColor={magColor(eq.magnitude) + '80'}
              strokeWidth={1}
            />
            <Marker
              coordinate={{ latitude: eq.lat, longitude: eq.lon }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <EqMarker magnitude={eq.magnitude} />
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

// ─── List row ─────────────────────────────────────────────────────────────────
function EarthquakeRow({ eq }: { eq: Earthquake }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const color  = magColor(eq.magnitude);
  const bg     = magBg(eq.magnitude);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => eq.url && Linking.openURL(eq.url)}
      className={`flex-row items-center gap-3 px-4 py-3 border-b ${
        isDark ? 'border-white/5' : 'border-black/5'
      }`}
    >
      <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: bg }}>
        <Text className="text-[20px] font-black leading-none" style={{ color }}>
          {eq.magnitude.toFixed(1)}
        </Text>
        <Text className="text-[8px] font-bold uppercase tracking-wide mt-0.5" style={{ color }}>
          {magLabel(eq.magnitude)}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-slate-800 dark:text-slate-100" numberOfLines={2}>
          {eq.place}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text className="text-[11px] text-slate-400">{timeAgo(eq.time)}</Text>
          <Text className="text-[11px] text-slate-400">·</Text>
          <Text className="text-[11px] text-slate-400">{eq.depth.toFixed(0)} km deep</Text>
          {eq.tsunami === 1 && (
            <>
              <Text className="text-[11px] text-slate-400">·</Text>
              <Text className="text-[11px] font-bold text-blue-500">🌊 Tsunami</Text>
            </>
          )}
          {eq.felt != null && eq.felt > 0 && (
            <>
              <Text className="text-[11px] text-slate-400">·</Text>
              <Text className="text-[11px] text-slate-400">{eq.felt} felt</Text>
            </>
          )}
        </View>
      </View>

      <Text className="text-slate-300 dark:text-slate-600 text-base">›</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EarthquakesScreen() {
  const { data, isLoading, refetch } = useEarthquakes();
  const lastRefreshAt = useRef(0);
  const [tab, setTab] = useState<'map' | 'list'>('map');
  const insets = useSafeAreaInsets();

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAt.current = now;
    refetch();
  }, [refetch]);

  // Shared top section
  const header = (
    <>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Earthquakes
        </Text>
        <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
          Mediterranean region · M2+ · last 200 events
        </Text>
      </View>

      {isLoading
        ? <Shimmer height={80} borderRadius={20} style={{ margin: 16, marginTop: 8 }} />
        : data && <StatsCard data={data} />}

      <SegmentControl value={tab} onChange={setTab} />
    </>
  );

  if (tab === 'map') {
    return (
      <View className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-1 mx-4 mt-3 rounded-3xl overflow-hidden" style={{ marginBottom: insets.bottom + 12 }}>
          {isLoading ? (
            <Shimmer height={999} borderRadius={24} />
          ) : data ? (
            <EarthquakeMap data={data} />
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
        <Shimmer height={400} borderRadius={20} style={{ margin: 16, marginTop: 12 }} />
      ) : (
        <GlassCard className="mx-4 mt-3 p-0 overflow-hidden">
          {data?.map(eq => <EarthquakeRow key={eq.id} eq={eq} />)}
        </GlassCard>
      )}
      <View className="h-6" />
    </ScrollView>
  );
}
