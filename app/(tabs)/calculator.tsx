import Slider from '@react-native-community/slider';
import { useColorScheme } from 'nativewind';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassCard } from '../../components/GlassCard';

const TARGET   = 125;           // L per person per day
const AVG_DAYS = 30.44;

interface Category { label: string; color: string; bg: string }

function getCategory(l: number): Category {
  if (l < 100)   return { label: 'Excellent',     color: '#10B981', bg: '#10B98118' };
  if (l < 112.5) return { label: 'Good',           color: '#34D399', bg: '#34D39918' };
  if (l < 137.5) return { label: 'Average',        color: '#F59E0B', bg: '#F59E0B18' };
  if (l < 150)   return { label: 'Slightly High',  color: '#FB923C', bg: '#FB923C18' };
  if (l < 187.5) return { label: 'High',           color: '#EF4444', bg: '#EF444418' };
  return               { label: 'Very High',       color: '#B91C1C', bg: '#B91C1C18' };
}

function colorFor(l: number): string {
  const r = l / TARGET;
  if (r < 0.8) return '#10B981';
  if (r < 0.9) return '#34D399';
  if (r < 1.1) return '#F59E0B';
  if (r < 1.2) return '#FB923C';
  if (r < 1.5) return '#EF4444';
  return '#B91C1C';
}

// ─── Label helper ─────────────────────────────────────────────────────────────
function Label({ children }: { children: string }) {
  return (
    <Text className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CalculatorScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputBg = isDark ? 'bg-white/10' : 'bg-black/5';

  const [consumption, setConsumption] = useState('');
  const [months, setMonths]           = useState('');
  const [people, setPeople]           = useState('');
  const [pledge, setPledge]           = useState(0);

  const result = useMemo(() => {
    const c = parseFloat(consumption);
    const m = parseFloat(months);
    const p = parseFloat(people);
    if (!c || !m || !p || c > 500 || m < 1 || p < 1 || p > 15) return null;
    const lpppd   = (c * 1000) / (m * AVG_DAYS * p);
    const diffPct = ((lpppd - TARGET) / TARGET) * 100;
    return { lpppd, diffPct };
  }, [consumption, months, people]);

  const cat          = result ? getCategory(result.lpppd) : null;
  const fill         = result ? colorFor(result.lpppd) : '#0EA5E9';
  const pledgedLpppd = result ? result.lpppd * (1 - pledge) : null;
  const pledgedCat   = pledgedLpppd != null ? getCategory(pledgedLpppd) : null;

  const inputStyle = `rounded-2xl px-4 py-3.5 text-base font-semibold text-slate-900 dark:text-slate-100 ${inputBg}`;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Water Calculator
          </Text>
          <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
            Target: {TARGET} L per person per day
          </Text>
        </View>

        {/* ── Inputs ── */}
        <GlassCard className="mx-4 mt-2">
          <Label>Water bill (m³)</Label>
          <TextInput
            className={inputStyle}
            placeholder="e.g. 24"
            placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
            keyboardType="decimal-pad"
            value={consumption}
            onChangeText={t => (parseFloat(t) <= 500 || t === '') && setConsumption(t)}
            maxLength={6}
          />

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Label>Period (months)</Label>
              <TextInput
                className={inputStyle}
                placeholder="e.g. 4"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                keyboardType="number-pad"
                value={months}
                onChangeText={setMonths}
                maxLength={2}
              />
            </View>
            <View className="flex-1">
              <Label>People</Label>
              <TextInput
                className={inputStyle}
                placeholder="e.g. 3"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                keyboardType="number-pad"
                value={people}
                onChangeText={t => (parseInt(t) <= 15 || t === '') && setPeople(t)}
                maxLength={2}
              />
            </View>
          </View>
        </GlassCard>

        {result && cat ? (
          <>
            {/* ── Result ── */}
            <GlassCard className="mx-4 mt-3">
              <View className="flex-row items-start justify-between mb-3">
                <View>
                  <Text className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Daily per person
                  </Text>
                  <Text className="text-[40px] font-black leading-none" style={{ color: fill }}>
                    {result.lpppd.toFixed(0)}
                    <Text className="text-[18px] font-bold"> L/day</Text>
                  </Text>
                </View>
                <View className="px-3 py-1.5 rounded-full mt-1" style={{ backgroundColor: cat.bg }}>
                  <Text className="text-[12px] font-bold" style={{ color: cat.color }}>
                    {cat.label}
                  </Text>
                </View>
              </View>

              {/* Target marker bar */}
              <View className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 mb-2 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((result.lpppd / (TARGET * 2)) * 100, 100)}%`,
                    backgroundColor: fill,
                  }}
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-slate-400">Target: {TARGET} L/day</Text>
                <Text className="text-[12px] font-bold" style={{ color: fill }}>
                  {result.diffPct > 0 ? '+' : ''}{result.diffPct.toFixed(1)}% vs target
                </Text>
              </View>
            </GlassCard>

            {/* ── Pledge ── */}
            <GlassCard className="mx-4 mt-3">
              <Text className="text-[15px] font-bold mb-0.5 text-slate-900 dark:text-slate-100">
                Pledge a reduction
              </Text>
              <Text className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                How much will you commit to saving?
              </Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[32px] font-black leading-none" style={{ color: fill }}>
                  {Math.round(pledge * 100)}%
                </Text>
                {pledgedLpppd != null && (
                  <View className="items-end">
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400">New consumption</Text>
                    <Text className="text-[22px] font-bold" style={{ color: pledgedCat?.color }}>
                      {pledgedLpppd.toFixed(0)} L/day
                    </Text>
                  </View>
                )}
              </View>

              <Slider
                value={pledge}
                onValueChange={setPledge}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                minimumTrackTintColor={fill}
                maximumTrackTintColor={isDark ? '#1E293B' : '#E2E8F0'}
                thumbTintColor={fill}
                style={{ marginHorizontal: -8 }}
              />

              <View className="flex-row justify-between mt-1 mb-4">
                <Text className="text-[10px] text-slate-400">0%</Text>
                <Text className="text-[10px] text-slate-400">50%</Text>
                <Text className="text-[10px] text-slate-400">100%</Text>
              </View>

              {/* Quick presets */}
              <View className="flex-row gap-2">
                {[0, 0.05, 0.1, 0.2, 0.3].map(p => {
                  const active = Math.round(pledge * 100) === Math.round(p * 100);
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPledge(p)}
                      className={`flex-1 py-2 rounded-full items-center ${
                        active ? 'bg-sky-500' : isDark ? 'bg-white/10' : 'bg-black/5'
                      }`}
                    >
                      <Text className={`text-[11px] font-bold ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {Math.round(p * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {pledge > 0 && pledgedCat && (
                <View
                  className="mt-3 rounded-2xl px-4 py-3 flex-row items-center gap-3"
                  style={{ backgroundColor: pledgedCat.bg }}
                >
                  <Text className="text-[22px]">{pledge >= 0.2 ? '🎉' : '👍'}</Text>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold" style={{ color: pledgedCat.color }}>
                      {pledgedCat.label} — {pledgedLpppd!.toFixed(0)} L/day
                    </Text>
                    <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                      Saving {(result.lpppd - pledgedLpppd!).toFixed(0)} L per person per day
                    </Text>
                  </View>
                </View>
              )}
            </GlassCard>

            {/* ── Tips ── */}
            <GlassCard className="mx-4 mt-3">
              <Text className="text-[15px] font-bold mb-3 text-slate-900 dark:text-slate-100">
                Conservation Tips
              </Text>
              {[
                ['🚿', 'Shorter showers (≤ 5 min)', '~35 L saved/day'],
                ['🪥', 'Turn off tap while brushing', '~12 L saved/day'],
                ['🌿', 'Water plants at dawn or dusk', 'less evaporation'],
                ['🔧', 'Fix leaky taps promptly', 'up to 20 L/day'],
                ['🥗', 'Less meat, one meal/week', 'up to 500 L saved'],
              ].map(([icon, tip, saving]) => (
                <View key={tip} className="flex-row items-start gap-3 mb-3 last:mb-0">
                  <Text className="text-[20px] leading-tight">{icon}</Text>
                  <View className="flex-1">
                    <Text className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{tip}</Text>
                    <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">{saving}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </>
        ) : (
          <View className="items-center mt-10 px-8">
            <Text className="text-[64px]">💧</Text>
            <Text className="text-[16px] font-semibold mt-3 text-center text-slate-500 dark:text-slate-400">
              Enter your water bill details above to see your daily consumption
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
