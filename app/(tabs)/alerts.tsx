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
