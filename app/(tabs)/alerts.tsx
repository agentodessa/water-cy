import { useColorScheme } from 'nativewind';
import React, { useCallback, useRef } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from '../../components/Shimmer';
import { useAlertNotifications } from '../../hooks/useAlertNotifications';
import { useAlertPreferences } from '../../hooks/useAlertPreferences';
import { type Alert, type AlertSeverity, type AlertType, useAlerts } from '../../hooks/useAlerts';
import { timeAgo } from '../../lib/timeAgo';

const REFRESH_COOLDOWN_MS = 15_000;

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; label: string; word: string }> = {
  Red:    { color: '#EF4444', label: 'Critical', word: 'RED'    },
  Orange: { color: '#F59E0B', label: 'Warning',  word: 'ORANGE' },
  Green:  { color: '#10B981', label: 'Advisory', word: 'GREEN'  },
};

const SEVERITY_ORDER: AlertSeverity[] = ['Red', 'Orange', 'Green'];

const TYPE_CONFIG: Record<AlertType, { icon: string; label: string }> = {
  earthquake: { icon: '🌍', label: 'Quake'    },
  flood:      { icon: '🌊', label: 'Flood'    },
  cyclone:    { icon: '🌀', label: 'Cyclone'  },
  volcano:    { icon: '🌋', label: 'Volcano'  },
  drought:    { icon: '☀️', label: 'Drought'  },
};

const ALL_TYPES: AlertType[] = ['earthquake', 'flood', 'cyclone', 'volcano', 'drought'];

function alphaHex(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const a = Math.round(clamped * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

export default function AlertsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const prefs = useAlertPreferences();
  const { data, isLoading, isError, error, refetch } = useAlerts(prefs.enabledTypes);
  const lastRefreshAt = useRef(0);
  const insets = useSafeAreaInsets();

  useAlertNotifications(data);

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshAt.current = now;
    refetch();
  }, [refetch]);

  const counts = (data ?? []).reduce(
    (acc, a) => { acc[a.severity] = (acc[a.severity] ?? 0) + 1; return acc; },
    {} as Record<AlertSeverity, number>,
  );

  const sorted = (data ?? []).slice().sort((a, b) => {
    const sevDiff = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (sevDiff !== 0) return sevDiff;
    return b.date - a.date;
  });

  const allEnabled = ALL_TYPES.every(t => prefs.isEnabled(t));

  return (
    <ScrollView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#0EA5E9" />
      }
    >
      <View className="px-4 pb-2" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Alerts
        </Text>
        <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
          Cyprus · GDACS
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      >
        <FilterChip
          label="All"
          active={allEnabled}
          onPress={() => prefs.setAll(!allEnabled)}
          isDark={isDark}
        />
        {ALL_TYPES.map(type => (
          <FilterChip
            key={type}
            label={TYPE_CONFIG[type].label}
            icon={TYPE_CONFIG[type].icon}
            active={prefs.isEnabled(type) && !allEnabled}
            onPress={() => prefs.toggleType(type)}
            isDark={isDark}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <>
          <Shimmer height={140} borderRadius={20} style={{ margin: 16, marginTop: 4 }} />
          <Shimmer height={100} borderRadius={20} style={{ marginHorizontal: 16, marginBottom: 12 }} />
          <Shimmer height={100} borderRadius={20} style={{ marginHorizontal: 16, marginBottom: 12 }} />
        </>
      ) : isError ? (
        <ErrorCard message={error instanceof Error ? error.message : 'Unknown error'} onRetry={() => refetch()} isDark={isDark} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyCard isDark={isDark} />
      ) : (
        <>
          <SeveritySummary counts={counts} isDark={isDark} />
          <View className="px-4 pb-6" style={{ gap: 10 }}>
            {sorted.map(a => (
              <AlertCard key={a.id} alert={a} isDark={isDark} />
            ))}
          </View>
        </>
      )}

      <View style={{ height: insets.bottom + 16 }} />
    </ScrollView>
  );
}

interface FilterChipProps {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}

function FilterChip({ label, icon, active, onPress, isDark }: FilterChipProps) {
  const inactiveBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const inactiveTx = isDark ? '#94A3B8' : '#64748B';
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center rounded-full"
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        marginRight: 8,
        backgroundColor: active ? '#0EA5E9' : inactiveBg,
        borderWidth: 1,
        borderColor: active ? '#0EA5E9' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'),
        gap: 6,
      }}
    >
      {icon ? <Text style={{ fontSize: 13 }}>{icon}</Text> : null}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: active ? '#FFFFFF' : inactiveTx,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface SeveritySummaryProps {
  counts: Record<AlertSeverity, number>;
  isDark: boolean;
}

function SeveritySummary({ counts, isDark }: SeveritySummaryProps) {
  const bg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';

  return (
    <View
      className="mx-4 mb-3"
      style={{ backgroundColor: bg, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 6 }}
    >
      {SEVERITY_ORDER.map((sev, i) => {
        const config = SEVERITY_CONFIG[sev];
        const n = counts[sev] ?? 0;
        return (
          <View
            key={sev}
            className="flex-row items-center px-3 py-2"
            style={{
              borderBottomWidth: i < SEVERITY_ORDER.length - 1 ? 1 : 0,
              borderBottomColor: divider,
              gap: 10,
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: config.color }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: text, flex: 1 }}>
              {config.label}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1.3,
                color: config.color,
              }}
            >
              {config.word}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: alphaHex(config.color, 0.12),
                minWidth: 36,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: config.color }}>
                {n}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface AlertCardProps {
  alert: Alert;
  isDark: boolean;
}

function AlertCard({ alert, isDark }: AlertCardProps) {
  const sev = SEVERITY_CONFIG[alert.severity];
  const type = TYPE_CONFIG[alert.type];
  const bg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const border = alphaHex(sev.color, 0.2);
  const title = isDark ? '#F1F5F9' : '#0F172A';
  const desc = isDark ? '#94A3B8' : '#64748B';
  const meta = isDark ? '#64748B' : '#94A3B8';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => alert.url && Linking.openURL(alert.url)}
      style={{
        backgroundColor: bg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        padding: 14,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: alphaHex(sev.color, 0.12),
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: sev.color }}>
            {sev.label.toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 14 }}>{type.icon}</Text>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: meta,
          }}
        >
          {type.label}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 11, color: meta }}>{timeAgo(alert.date)}</Text>
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: '800',
          color: title,
          marginTop: 8,
          letterSpacing: -0.2,
          lineHeight: 21,
        }}
        numberOfLines={2}
      >
        {alert.title}
      </Text>

      {alert.description ? (
        <Text
          style={{ fontSize: 13, color: desc, marginTop: 4, lineHeight: 18 }}
          numberOfLines={2}
        >
          {alert.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function ErrorCard({ message, onRetry, isDark }: { message: string; onRetry: () => void; isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  return (
    <View className="mx-4 mt-3 rounded-2xl p-4" style={{ backgroundColor: bg }}>
      <Text className="text-[14px] font-bold text-red-500 mb-2">Failed to load alerts</Text>
      <Text className="text-[12px] text-slate-400 mb-3">{message}</Text>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.8} className="bg-sky-500 self-start px-4 py-2 rounded-xl">
        <Text className="text-white text-[13px] font-bold">Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyCard({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const text = isDark ? '#94A3B8' : '#64748B';
  return (
    <View
      className="mx-4 mt-3 items-center justify-center rounded-2xl"
      style={{ backgroundColor: bg, paddingVertical: 32, paddingHorizontal: 16 }}
    >
      <Text style={{ fontSize: 14, color: text }}>No active alerts for Cyprus</Text>
    </View>
  );
}
