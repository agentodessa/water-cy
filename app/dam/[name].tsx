import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { formatMCM, formatPercentage } from '../../lib/format';

const HEADER_HEIGHT = 220;
const CARD_OVERLAP = 28;

function severityColor(pct: number): string {
  if (pct < 0.2) return '#EF4444';
  if (pct < 0.5) return '#F59E0B';
  return '#10B981';
}

export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { data: dams }        = useDams();
  const { data: percentages } = usePercentages();
  const { data: stats }       = useDateStatistics();

  const dam        = dams?.find(d => d.nameEn === name);
  const pct        = percentages?.damNamesToPercentage[name ?? ''] ?? 0;
  const storageMCM = stats?.storageInMCM[name ?? ''] ?? 0;
  const inflowMCM  = stats?.inflowInMCM[name ?? ''] ?? 0;

  if (!dam) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F0F4F8] dark:bg-[#0A0F1E]">
        <Text className="text-slate-900 dark:text-slate-100">Loading…</Text>
      </View>
    );
  }

  const capacityMCM = dam.capacity / 1_000_000;
  const fillColor   = severityColor(pct);

  const cardBg      = isDark ? '#111827' : '#FFFFFF';
  const cardText    = isDark ? '#F1F5F9' : '#0F172A';
  const secondary   = isDark ? '#94A3B8' : '#64748B';
  const screenBg    = isDark ? '#0A0F1E' : '#F0F4F8';

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: screenBg }}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      <View className="pb-10">
        <Header
          imageUrl={dam.imageUrl}
          river={dam.riverNameEl}
          name={dam.nameEn}
          insetTop={insets.top}
          onBack={() => router.back()}
        />

        <View className="px-4" style={{ marginTop: -CARD_OVERLAP }}>
          <View
            className="rounded-[20px] p-4 flex-row"
            style={{
              backgroundColor: cardBg,
              shadowColor: '#0F172A',
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            <StatCell
              label="Fill"
              value={formatPercentage(pct)}
              valueColor={fillColor}
              labelColor={secondary}
            />
            <StatCell
              label="Stored"
              value={formatMCM(storageMCM)}
              valueColor={cardText}
              labelColor={secondary}
            />
            <StatCell
              label="Capacity"
              value={formatMCM(capacityMCM)}
              valueColor={cardText}
              labelColor={secondary}
            />
          </View>
        </View>

        <View className="px-4 mt-3 flex-row gap-2.5">
          <MetaTile label="Height"       value={`${dam.height}m`}            bg={cardBg} valueColor={cardText} labelColor={secondary} />
          <MetaTile label="Built"        value={`${dam.yearOfConstruction}`} bg={cardBg} valueColor={cardText} labelColor={secondary} />
          <MetaTile label="Inflow today" value={`${inflowMCM.toFixed(3)}`}   unit="MCM"  bg={cardBg} valueColor="#0EA5E9" labelColor={secondary} />
        </View>

        <View
          className="flex-row items-center gap-2 mx-4 mt-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: cardBg }}
        >
          <Ionicons name="water" size={16} color="#0EA5E9" />
          <Text className="text-[9px] font-extrabold tracking-widest uppercase" style={{ color: secondary }}>River</Text>
          <Text className="text-[14px] font-semibold" style={{ color: cardText }}>{dam.riverNameEl}</Text>
          <View className="flex-1" />
          <Text className="text-[11px]" style={{ color: secondary }}>{dam.typeEl}</Text>
        </View>

        {dam.wikipediaUrl ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(dam.wikipediaUrl)}
            className="mx-4 mt-3 rounded-2xl px-4 py-3.5 flex-row items-center justify-center"
            style={{ backgroundColor: '#0EA5E9' }}
          >
            <Text className="text-[14px] font-bold text-white">View on Wikipedia</Text>
            <Text className="text-[14px] font-bold text-white ml-1">→</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

interface HeaderProps {
  imageUrl?: string;
  river: string;
  name: string;
  insetTop: number;
  onBack: () => void;
}

function Header({ imageUrl, river, name, insetTop, onBack }: HeaderProps) {
  return (
    <View style={{ height: HEADER_HEIGHT, overflow: 'hidden' }}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 400 220">
        <Defs>
          <LinearGradient id="headerBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0EA5E9" />
            <Stop offset="1" stopColor="#0284C7" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="220" fill="url(#headerBg)" />
        <Path d="M0 140 Q 100 120 200 130 T 400 135 L 400 220 L 0 220 Z" fill="rgba(255,255,255,0.15)" />
        <Path d="M0 165 Q 100 155 200 160 T 400 162 L 400 220 L 0 220 Z" fill="rgba(255,255,255,0.10)" />
      </Svg>

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}

      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 400 220">
        <Defs>
          <LinearGradient id="dimOverlay" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity="0" />
            <Stop offset="0.55" stopColor="#000000" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.65" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="220" fill="url(#dimOverlay)" />
      </Svg>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onBack}
        className="absolute left-4 rounded-full items-center justify-center"
        style={{ top: insetTop + 8, width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      <View className="absolute left-5 right-5" style={{ bottom: CARD_OVERLAP + 14 }}>
        <Text
          className="text-[10px] font-extrabold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {river || 'Reservoir'}
        </Text>
        <Text
          className="font-black text-white mt-1"
          style={{ fontSize: 32, letterSpacing: -0.5, lineHeight: 36 }}
          numberOfLines={2}
        >
          {name}
        </Text>
      </View>
    </View>
  );
}

interface StatCellProps {
  label: string;
  value: string;
  valueColor: string;
  labelColor: string;
}

function StatCell({ label, value, valueColor, labelColor }: StatCellProps) {
  return (
    <View className="flex-1">
      <Text
        className="text-[9px] font-extrabold uppercase tracking-widest"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <Text
        className="text-[18px] font-black mt-1"
        style={{ color: valueColor, letterSpacing: -0.4 }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

interface MetaTileProps {
  label: string;
  value: string;
  unit?: string;
  bg: string;
  valueColor: string;
  labelColor: string;
}

function MetaTile({ label, value, unit, bg, valueColor, labelColor }: MetaTileProps) {
  return (
    <View
      className="flex-1 rounded-2xl px-3 py-3"
      style={{ backgroundColor: bg }}
    >
      <Text
        className="text-[9px] font-extrabold uppercase tracking-widest"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline mt-1">
        <Text className="text-[16px] font-extrabold" style={{ color: valueColor }} numberOfLines={1}>{value}</Text>
        {unit ? (
          <Text className="text-[10px] font-bold ml-1" style={{ color: labelColor }}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
