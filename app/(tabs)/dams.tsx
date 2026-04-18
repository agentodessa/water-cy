import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import RNMapView, { Marker, type Region } from 'react-native-maps';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DamRow } from '../../components/DamRow';
import { Shimmer } from '../../components/Shimmer';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import type { Dam } from '../../lib/api';
import { formatMCM, formatPercentage } from '../../lib/format';

type ViewMode = 'map' | 'list';
type Severity = 'critical' | 'warning' | 'healthy';

interface GroupRow {
  dam: Dam;
  pct: number;
  storageMCM: number;
}

interface Group {
  key: Severity;
  label: string;
  color: string;
  rows: GroupRow[];
}

const INITIAL_REGION: Region = {
  latitude:       35.05,
  longitude:      33.25,
  latitudeDelta:  1.6,
  longitudeDelta: 2.2,
};

function severityColor(pct: number): string {
  if (pct < 0.2) return '#EF4444';
  if (pct < 0.5) return '#F59E0B';
  return '#10B981';
}

export default function DamsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ViewMode>('map');
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const { data: dams,        isLoading: l1, refetch: r1 } = useDams();
  const { data: percentages, isLoading: l2, refetch: r2 } = usePercentages();
  const { data: stats } = useDateStatistics();
  const isLoading = l1 || l2;

  const groups: Group[] = useMemo(() => {
    if (!dams || !percentages) return [];
    const critical: GroupRow[] = [];
    const warning:  GroupRow[] = [];
    const healthy:  GroupRow[] = [];
    for (const dam of dams) {
      const pct = percentages.damNamesToPercentage[dam.nameEn] ?? 0;
      const storageMCM = stats?.storageInMCM[dam.nameEn] ?? 0;
      const row = { dam, pct, storageMCM };
      if (pct < 0.2)      critical.push(row);
      else if (pct < 0.5) warning.push(row);
      else                healthy.push(row);
    }
    const byFillAsc = (a: GroupRow, b: GroupRow) => a.pct - b.pct;
    critical.sort(byFillAsc);
    warning.sort(byFillAsc);
    healthy.sort((a, b) => b.pct - a.pct);
    return [
      { key: 'critical', label: 'Critical', color: '#EF4444', rows: critical },
      { key: 'warning',  label: 'Warning',  color: '#F59E0B', rows: warning  },
      { key: 'healthy',  label: 'Healthy',  color: '#10B981', rows: healthy  },
    ].filter(g => g.rows.length > 0) as Group[];
  }, [dams, percentages, stats]);

  const firstCritical = useMemo(() => {
    if (!dams || !percentages) return null;
    const withPct = dams.map(d => ({ d, pct: percentages.damNamesToPercentage[d.nameEn] ?? 0 }));
    withPct.sort((a, b) => a.pct - b.pct);
    return withPct[0]?.d.nameEn ?? null;
  }, [dams, percentages]);

  const selectedName2 = selectedName ?? firstCritical;
  const selectedDam = selectedName2 ? dams?.find(d => d.nameEn === selectedName2) : null;
  const selectedPct = selectedName2 ? percentages?.damNamesToPercentage[selectedName2] ?? 0 : 0;

  const bgClass = 'flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]';

  return (
    <View className={bgClass}>
      <View style={{ paddingTop: insets.top }} />
      <View className="px-4 pt-2 pb-2">
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Reservoirs{dams ? ` · ${dams.length}` : ''}
        </Text>
      </View>

      <View className="px-4 pb-2">
        <SegmentedControl mode={mode} onChange={setMode} isDark={isDark} />
      </View>

      {mode === 'map' ? (
        <MapCanvas
          dams={dams ?? []}
          percentages={percentages?.damNamesToPercentage ?? {}}
          selectedName={selectedName2}
          onSelect={setSelectedName}
          isDark={isDark}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { r1(); r2(); }}
              tintColor="#0EA5E9"
            />
          }
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Shimmer key={i} height={80} borderRadius={14} style={{ marginHorizontal: 16, marginBottom: 10 }} />
              ))
            : groups.map(group => (
                <View key={group.key}>
                  <GroupHeader label={group.label} color={group.color} count={group.rows.length} />
                  {group.rows.map(({ dam, pct, storageMCM }) => (
                    <DamRow
                      key={dam.nameEn}
                      name={dam.nameEn}
                      percentage={pct}
                      capacityMCM={dam.capacity / 1_000_000}
                      storageMCM={storageMCM}
                      onPress={() => router.push(`/dam/${dam.nameEn}`)}
                    />
                  ))}
                </View>
              ))}
          <View style={{ height: insets.bottom + 16 }} />
        </ScrollView>
      )}

      {mode === 'map' && selectedDam ? (
        <BottomSheet
          dam={selectedDam}
          pct={selectedPct}
          storageMCM={stats?.storageInMCM[selectedDam.nameEn] ?? 0}
          onPress={() => router.push(`/dam/${selectedDam.nameEn}`)}
          isDark={isDark}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
  );
}

function severityLabel(pct: number): string {
  if (pct < 0.2) return 'CRITICAL';
  if (pct < 0.5) return 'WARNING';
  return 'HEALTHY';
}

interface GroupHeaderProps {
  label: string;
  color: string;
  count: number;
}

function GroupHeader({ label, color, count }: GroupHeaderProps) {
  return (
    <View className="flex-row items-center px-5 pt-4 pb-2" style={{ gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text
        className="text-[10px] font-extrabold uppercase"
        style={{ color, letterSpacing: 1.5 }}
      >
        {label}
      </Text>
      <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
        {`· ${count}`}
      </Text>
      <View className="flex-1 h-px ml-2 bg-slate-200 dark:bg-white/5" />
    </View>
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

interface MapCanvasProps {
  dams: Dam[];
  percentages: Record<string, number>;
  selectedName: string | null;
  onSelect: (name: string) => void;
  isDark: boolean;
}

function MapCanvas({ dams, percentages, selectedName, onSelect, isDark }: MapCanvasProps) {
  const mapRef = useRef<RNMapView>(null);

  const handleMarkerPress = async (name: string) => {
    const cam = await mapRef.current?.getCamera();
    onSelect(name);
    if (!cam || !mapRef.current) return;
    mapRef.current.animateCamera(cam, { duration: 0 });
    setTimeout(() => mapRef.current?.animateCamera(cam, { duration: 0 }), 50);
    setTimeout(() => mapRef.current?.animateCamera(cam, { duration: 0 }), 200);
  };

  return (
    <View className="flex-1">
      <RNMapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {dams.map(dam => {
          const pct = percentages[dam.nameEn] ?? 0;
          const selected = dam.nameEn === selectedName;
          return (
            <Marker
              key={dam.nameEn}
              coordinate={{ latitude: dam.lat, longitude: dam.lng }}
              onPress={e => {
                e.stopPropagation?.();
                handleMarkerPress(dam.nameEn);
              }}
              tracksViewChanges={selected}
              stopPropagation
              zIndex={selected ? 100 : 1}
            >
              <MarkerView pct={pct} selected={selected} />
            </Marker>
          );
        })}
      </RNMapView>
    </View>
  );
}

interface MarkerViewProps {
  pct: number;
  selected: boolean;
}

const DOT_SIZE = 18;

function MarkerView({ pct, selected }: MarkerViewProps) {
  const color = severityColor(pct);
  const inner = selected ? 10 : 6;

  const scale = useSharedValue(selected ? 1.1 : 1);
  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withTiming(1.4, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(1.1, { duration: 220, easing: Easing.inOut(Easing.cubic) }),
      );
    } else {
      scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    }
  }, [selected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: color,
          shadowOpacity: 0.55,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
        animStyle,
      ]}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
}

interface BottomSheetProps {
  dam: Dam;
  pct: number;
  storageMCM: number;
  onPress: () => void;
  isDark: boolean;
  bottomInset: number;
}

function BottomSheet({ dam, pct, storageMCM, onPress, isDark, bottomInset }: BottomSheetProps) {
  const color = severityColor(pct);
  const label = severityLabel(pct);
  const bg    = isDark ? '#111827' : '#FFFFFF';
  const text  = isDark ? '#F1F5F9' : '#0F172A';
  const meta  = isDark ? '#94A3B8' : '#64748B';
  const track = isDark ? '#1E293B' : '#E2E8F0';
  const capacityMCM = dam.capacity / 1_000_000;
  const fillPct = Math.min(Math.max(pct * 100, 0), 100);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: bottomInset + 64,
        left: 12,
        right: 12,
        backgroundColor: bg,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 12,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: -0.3 }}>
            {`${Math.round(pct * 100)}%`}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                letterSpacing: 1.4,
                color,
              }}
            >
              {label}
            </Text>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: meta }} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: meta }} numberOfLines={1}>
              {dam.typeEl}
            </Text>
          </View>
          <Text
            style={{ fontSize: 17, fontWeight: '800', color: text, marginTop: 1, letterSpacing: -0.3 }}
            numberOfLines={1}
          >
            {dam.nameEn}
          </Text>
          <View
            style={{
              height: 4,
              backgroundColor: track,
              borderRadius: 2,
              marginTop: 7,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${fillPct}%`,
                height: 4,
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: meta, marginTop: 5 }} numberOfLines={1}>
            <Text style={{ color: text, fontWeight: '700' }}>{formatMCM(storageMCM)}</Text>
            {` of ${formatMCM(capacityMCM)}`}
          </Text>
        </View>
        <Text style={{ fontSize: 24, color: meta, fontWeight: '300' }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}
