import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const ARC_SIZE = 170;
const PAD      = 10;
const SIZE     = ARC_SIZE + PAD * 2;
const STROKE   = 14;
const RADIUS   = (ARC_SIZE - STROKE) / 2;
const CENTER   = SIZE / 2;
const ARC_DEG  = 240;
const START    = 150;

function polar(cx: number, cy: number, r: number, deg: number) {
  'worklet';
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number): string {
  'worklet';
  const s = polar(CENTER, CENTER, RADIUS, endDeg);
  const e = polar(CENTER, CENTER, RADIUS, startDeg);
  const large = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${s.x} ${s.y} A ${RADIUS} ${RADIUS} 0 ${large} 0 ${e.x} ${e.y}`;
}

const AnimatedPath      = Animated.createAnimatedComponent(Path);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface SystemGaugeProps {
  percentage: number;
  date: string;
  totalCapacityInMCM?: number;
  delta7dMCM?: number;
}

function severityFor(pct: number): { label: string; color: string } {
  if (pct < 0.2) return { label: 'CRITICAL', color: '#EF4444' };
  if (pct < 0.5) return { label: 'WARNING',  color: '#F59E0B' };
  return { label: 'HEALTHY', color: '#10B981' };
}

function formatDate(date?: string): string {
  if (!date) return '';
  const m = date.match(/^(\w{3})\s+(\d+),\s+(\d{4})/);
  return m ? `${m[2]} ${m[1]} ${m[3]}` : date;
}

function formatDelta(mcm?: number): { value: string; color: string } {
  if (mcm === undefined || mcm === null || !isFinite(mcm)) {
    return { value: '—', color: '#94A3B8' };
  }
  const sign = mcm > 0 ? '+' : mcm < 0 ? '−' : '';
  const abs  = Math.abs(mcm);
  const str  = `${sign}${abs.toFixed(1)}`;
  const color = mcm > 0.05 ? '#10B981' : mcm < -0.05 ? '#EF4444' : '#94A3B8';
  return { value: str, color };
}

export function SystemGauge({ percentage, date, totalCapacityInMCM, delta7dMCM }: SystemGaugeProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark
    ? {
        cardBg:          '#0A0F1E',
        gradStart:       '#0A0F1E',
        gradEnd:         '#1E293B',
        track:           '#475569',
        eyebrow:         '#94A3B8',
        dateText:        '#64748B',
        fullLabel:       '#64748B',
        tileBg:          'rgba(255,255,255,0.04)',
        tileLabel:       '#64748B',
        tileValue:       '#F1F5F9',
        tileUnit:        '#94A3B8',
      }
    : {
        cardBg:          '#FFFFFF',
        gradStart:       '#FFFFFF',
        gradEnd:         '#E2E8F0',
        track:           '#CBD5E1',
        eyebrow:         '#475569',
        dateText:        '#64748B',
        fullLabel:       '#64748B',
        tileBg:          'rgba(15,23,42,0.04)',
        tileLabel:       '#64748B',
        tileValue:       '#0F172A',
        tileUnit:        '#64748B',
      };

  const animPct = useSharedValue(1);
  useEffect(() => {
    animPct.value = 1;
    animPct.value = withDelay(
      300,
      withTiming(percentage, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
  }, [percentage]);

  const trackPath = arcPath(START, START + ARC_DEG);

  const animPath = useDerivedValue(() => {
    'worklet';
    const pct = animPct.value;
    if (pct <= 0.001) return '';
    return arcPath(START, START + ARC_DEG * Math.min(pct, 1));
  });

  const animColor = useDerivedValue(() => {
    'worklet';
    return interpolateColor(
      animPct.value,
      [0, 0.2, 0.5, 1],
      ['#EF4444', '#EF4444', '#F59E0B', '#10B981'],
    );
  });

  const fillProps = useAnimatedProps(() => ({ d: animPath.value, stroke: animColor.value }));
  const glowProps = useAnimatedProps(() => ({ d: animPath.value, stroke: animColor.value, strokeOpacity: 0.25 }));

  const textProps = useAnimatedProps(() => ({
    text: `${(animPct.value * 100).toFixed(1)}%`,
    defaultValue: `${(percentage * 100).toFixed(1)}%`,
  }));

  const textColorStyle = useAnimatedStyle(() => ({ color: animColor.value }));

  const severity   = severityFor(percentage);
  const storedMCM  = totalCapacityInMCM ? totalCapacityInMCM * percentage : null;
  const formattedDate = formatDate(date);
  const delta      = formatDelta(delta7dMCM);

  return (
    <View
      className="mx-4 mt-2 rounded-[20px] overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        ...(isDark ? {} : {
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }),
      }}
    >
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.gradStart} />
            <Stop offset="1" stopColor={theme.gradEnd} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
      </Svg>

      <View className="px-5 pt-4 pb-4">
        <View className="flex-row justify-between items-start">
          <View>
            <Text
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: theme.eyebrow }}
            >
              National Storage
            </Text>
            {formattedDate ? (
              <Text className="text-[11px] mt-0.5" style={{ color: theme.dateText }}>{formattedDate}</Text>
            ) : null}
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${severity.color}1f` }}
          >
            <Text
              className="text-[10px] font-bold tracking-widest"
              style={{ color: severity.color }}
            >
              {severity.label}
            </Text>
          </View>
        </View>

        <View
          className="items-center justify-center"
          style={{ width: '100%', height: SIZE }}
        >
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', top: 0 }}>
            <AnimatedPath animatedProps={glowProps} strokeWidth={STROKE + 10} fill="none" strokeLinecap="round" />
            <Path d={trackPath} stroke={theme.track} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
            <AnimatedPath animatedProps={fillProps} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          </Svg>

          <View className="items-center">
            <AnimatedTextInput
              animatedProps={textProps}
              editable={false}
              underlineColorAndroid="transparent"
              style={[{
                fontSize: 40,
                fontWeight: '900',
                letterSpacing: -2,
                textAlign: 'center',
                minWidth: 160,
                padding: 0,
                backgroundColor: 'transparent',
              }, textColorStyle]}
            />
            <Text
              className="text-[10px] font-bold mt-1 uppercase tracking-widest"
              style={{ color: theme.fullLabel }}
            >
              Full
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <StatTile
            label="Stored"
            value={storedMCM !== null ? storedMCM.toFixed(1) : '—'}
            unit="MCM"
            theme={theme}
          />
          <StatTile
            label="Capacity"
            value={totalCapacityInMCM ? totalCapacityInMCM.toFixed(1) : '—'}
            unit="MCM"
            theme={theme}
          />
          <StatTile
            label="Δ 7d"
            value={delta.value}
            unit={delta.value === '—' ? undefined : 'MCM'}
            valueColor={delta.color}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
}

interface TileTheme {
  tileBg: string;
  tileLabel: string;
  tileValue: string;
  tileUnit: string;
}

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  theme: TileTheme;
}

function StatTile({ label, value, unit, valueColor, theme }: StatTileProps) {
  return (
    <View
      className="flex-1 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: theme.tileBg }}
    >
      <Text
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: theme.tileLabel }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline mt-1">
        <Text
          className="text-[16px] font-extrabold"
          style={{ color: valueColor ?? theme.tileValue }}
          numberOfLines={1}
        >
          {value}
        </Text>
        {unit ? (
          <Text className="text-[10px] font-bold ml-1" style={{ color: theme.tileUnit }}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
