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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TARGET   = 125;           // L per person per day
const AVG_DAYS = 30.44;

interface Category { label: string; color: string }

function getCategory(l: number): Category {
  if (l < 100)   return { label: 'Excellent',    color: '#10B981' };
  if (l < 112.5) return { label: 'Good',         color: '#34D399' };
  if (l < 137.5) return { label: 'Average',      color: '#F59E0B' };
  if (l < 150)   return { label: 'Slightly High',color: '#FB923C' };
  if (l < 187.5) return { label: 'High',         color: '#EF4444' };
  return               { label: 'Very High',     color: '#B91C1C' };
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

function alphaHex(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

interface ThemeColors {
  cardBg: string;
  cardBorder: string;
  text: string;
  meta: string;
  dim: string;
  inputBg: string;
  track: string;
}

function useThemeColors(isDark: boolean): ThemeColors {
  return isDark
    ? {
        cardBg:     'rgba(255,255,255,0.04)',
        cardBorder: 'rgba(255,255,255,0.08)',
        text:       '#F1F5F9',
        meta:       '#94A3B8',
        dim:        '#64748B',
        inputBg:    'rgba(255,255,255,0.06)',
        track:      'rgba(255,255,255,0.10)',
      }
    : {
        cardBg:     '#FFFFFF',
        cardBorder: 'rgba(15,23,42,0.06)',
        text:       '#0F172A',
        meta:       '#64748B',
        dim:        '#94A3B8',
        inputBg:    'rgba(15,23,42,0.04)',
        track:      '#E2E8F0',
      };
}

export default function CalculatorScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useThemeColors(isDark);
  const insets = useSafeAreaInsets();

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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F0F4F8] dark:bg-[#0A0F1E]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
          <Text className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Water Calculator
          </Text>
          <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
            Target: {TARGET} L per person per day
          </Text>
        </View>

        <Card theme={theme}>
          <Eyebrow theme={theme}>Water bill (m³)</Eyebrow>
          <CalcInput
            placeholder="e.g. 24"
            value={consumption}
            onChangeText={t => (parseFloat(t) <= 500 || t === '') && setConsumption(t)}
            keyboardType="decimal-pad"
            maxLength={6}
            theme={theme}
          />

          <View className="flex-row" style={{ gap: 10, marginTop: 14 }}>
            <View className="flex-1">
              <Eyebrow theme={theme}>Period (months)</Eyebrow>
              <CalcInput
                placeholder="e.g. 4"
                value={months}
                onChangeText={setMonths}
                keyboardType="number-pad"
                maxLength={2}
                theme={theme}
              />
            </View>
            <View className="flex-1">
              <Eyebrow theme={theme}>People</Eyebrow>
              <CalcInput
                placeholder="e.g. 3"
                value={people}
                onChangeText={t => (parseInt(t, 10) <= 15 || t === '') && setPeople(t)}
                keyboardType="number-pad"
                maxLength={2}
                theme={theme}
              />
            </View>
          </View>
        </Card>

        {result && cat ? (
          <>
            <Card theme={theme}>
              <View className="flex-row items-start justify-between" style={{ marginBottom: 14 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Eyebrow theme={theme}>Daily per person</Eyebrow>
                  <View className="flex-row items-baseline" style={{ marginTop: 6 }}>
                    <Text
                      style={{
                        fontSize: 44,
                        fontWeight: '900',
                        color: fill,
                        letterSpacing: -1.5,
                        lineHeight: 46,
                      }}
                    >
                      {result.lpppd.toFixed(0)}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.meta, marginLeft: 6 }}>
                      L/day
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: alphaHex(cat.color, 0.14),
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: cat.color, letterSpacing: 0.3 }}>
                    {cat.label}
                  </Text>
                </View>
              </View>

              <TargetBar lpppd={result.lpppd} color={fill} trackColor={theme.track} />

              <View className="flex-row justify-between" style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: theme.dim, fontWeight: '600' }}>
                  Target {TARGET} L/day
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: fill }}>
                  {result.diffPct > 0 ? '+' : ''}{result.diffPct.toFixed(1)}% vs target
                </Text>
              </View>
            </Card>

            <Card theme={theme}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, letterSpacing: -0.2 }}>
                Pledge a reduction
              </Text>
              <Text style={{ fontSize: 12, color: theme.meta, marginTop: 2 }}>
                How much will you commit to saving?
              </Text>

              <View className="flex-row justify-between items-end" style={{ marginTop: 16, marginBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: '900',
                    color: fill,
                    letterSpacing: -1.2,
                    lineHeight: 38,
                  }}
                >
                  {Math.round(pledge * 100)}%
                </Text>
                {pledgedLpppd != null ? (
                  <View className="items-end">
                    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: theme.dim, textTransform: 'uppercase' }}>
                      New
                    </Text>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '900',
                        color: pledgedCat?.color,
                        letterSpacing: -0.5,
                        marginTop: 2,
                      }}
                    >
                      {pledgedLpppd.toFixed(0)}
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.meta }}> L/day</Text>
                    </Text>
                  </View>
                ) : null}
              </View>

              <Slider
                value={pledge}
                onValueChange={setPledge}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                minimumTrackTintColor={fill}
                maximumTrackTintColor={theme.track}
                thumbTintColor={fill}
                style={{ marginHorizontal: -8 }}
              />

              <View className="flex-row justify-between" style={{ marginTop: -4, marginBottom: 14 }}>
                <Text style={{ fontSize: 10, color: theme.dim, fontWeight: '600' }}>0%</Text>
                <Text style={{ fontSize: 10, color: theme.dim, fontWeight: '600' }}>50%</Text>
                <Text style={{ fontSize: 10, color: theme.dim, fontWeight: '600' }}>100%</Text>
              </View>

              <View className="flex-row" style={{ gap: 6 }}>
                {[0, 0.05, 0.1, 0.2, 0.3].map(p => {
                  const active = Math.round(pledge * 100) === Math.round(p * 100);
                  return (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.7}
                      onPress={() => setPledge(p)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 999,
                        alignItems: 'center',
                        backgroundColor: active ? '#0EA5E9' : theme.inputBg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: active ? '#FFFFFF' : theme.meta,
                        }}
                      >
                        {Math.round(p * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {pledge > 0 && pledgedCat ? (
                <View
                  style={{
                    marginTop: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: alphaHex(pledgedCat.color, 0.12),
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{pledge >= 0.2 ? '🎉' : '👍'}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: '800', color: pledgedCat.color, letterSpacing: -0.2 }}
                    >
                      {pledgedCat.label} · {pledgedLpppd!.toFixed(0)} L/day
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.meta, marginTop: 2 }}>
                      Saving {(result.lpppd - pledgedLpppd!).toFixed(0)} L per person per day
                    </Text>
                  </View>
                </View>
              ) : null}
            </Card>

            <Card theme={theme}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, marginBottom: 10, letterSpacing: -0.2 }}>
                Conservation Tips
              </Text>
              {[
                ['🚿', 'Shorter showers (≤ 5 min)',   '~35 L saved/day'],
                ['🪥', 'Turn off tap while brushing', '~12 L saved/day'],
                ['🌿', 'Water plants at dawn or dusk','less evaporation'],
                ['🔧', 'Fix leaky taps promptly',     'up to 20 L/day'],
                ['🥗', 'Less meat, one meal/week',    'up to 500 L saved'],
              ].map(([icon, tip, saving], i, arr) => (
                <View
                  key={tip}
                  className="flex-row items-start"
                  style={{
                    gap: 12,
                    paddingVertical: 10,
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                    borderBottomColor: theme.cardBorder,
                  }}
                >
                  <Text style={{ fontSize: 20, lineHeight: 22 }}>{icon}</Text>
                  <View className="flex-1">
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{tip}</Text>
                    <Text style={{ fontSize: 11, color: theme.meta, marginTop: 2 }}>{saving}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <View className="items-center mt-12 px-8">
            <Text style={{ fontSize: 64 }}>💧</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                marginTop: 12,
                textAlign: 'center',
                color: theme.meta,
                lineHeight: 22,
              }}
            >
              Enter your water bill details above to see your daily consumption
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface CardProps {
  theme: ThemeColors;
  children: React.ReactNode;
}

function Card({ theme, children }: CardProps) {
  return (
    <View
      className="mx-4 mt-3"
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        padding: 16,
      }}
    >
      {children}
    </View>
  );
}

function Eyebrow({ children, theme }: { children: string; theme: ThemeColors }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: theme.meta,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

interface CalcInputProps {
  value: string;
  placeholder: string;
  onChangeText: (t: string) => void;
  keyboardType: 'decimal-pad' | 'number-pad';
  maxLength?: number;
  theme: ThemeColors;
}

function CalcInput({ value, placeholder, onChangeText, keyboardType, maxLength, theme }: CalcInputProps) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={theme.dim}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
      style={{
        backgroundColor: theme.inputBg,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
      }}
    />
  );
}

interface TargetBarProps {
  lpppd: number;
  color: string;
  trackColor: string;
}

function TargetBar({ lpppd, color, trackColor }: TargetBarProps) {
  const maxX = TARGET * 2;
  const fillPct = Math.min((lpppd / maxX) * 100, 100);
  const targetPct = (TARGET / maxX) * 100;

  return (
    <View style={{ height: 10, position: 'relative' }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 3,
          height: 4,
          borderRadius: 2,
          backgroundColor: trackColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 3,
          height: 4,
          width: `${fillPct}%`,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: `${targetPct}%`,
          top: 0,
          marginLeft: -5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FFFFFF',
          borderWidth: 2,
          borderColor: '#0F172A',
        }}
      />
    </View>
  );
}
