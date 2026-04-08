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
import Svg, { Path } from 'react-native-svg';
import { GlassCard } from './GlassCard';

const ARC_SIZE = 200;
const PAD      = 20;
const SIZE     = ARC_SIZE + PAD * 2;
const STROKE   = 16;
const RADIUS   = (ARC_SIZE - STROKE) / 2;
const CENTER   = SIZE / 2;
const ARC_DEG  = 240;
const START    = 150;

// Worklet-safe helpers (run on UI thread)
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
}

export function SystemGauge({ percentage, date, totalCapacityInMCM }: SystemGaugeProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animate from 1.0 (100%) → actual percentage each time data arrives
  const animPct = useSharedValue(1);
  useEffect(() => {
    animPct.value = 1;
    animPct.value = withDelay(
      300,
      withTiming(percentage, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
  }, [percentage]);

  const trackColor = isDark ? '#334155' : '#CBD5E1';
  const trackPath  = arcPath(START, START + ARC_DEG); // static

  // Animated path
  const animPath = useDerivedValue(() => {
    'worklet';
    const pct = animPct.value;
    if (pct <= 0.001) return '';
    return arcPath(START, START + ARC_DEG * Math.min(pct, 1));
  });

  // Color interpolates green → yellow → red as pct falls
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

  const storedMCM = totalCapacityInMCM ? totalCapacityInMCM * percentage : null;

  const formattedDate = (() => {
    const m = date?.match(/^(\w{3})\s+(\d+),\s+(\d{4})/);
    if (m) return `${m[2]} ${m[1]} ${m[3]}`;
    return date ?? '';
  })();

  return (
    <GlassCard className="m-4">
      <View className="items-center">
        <View style={{ width: SIZE, height: SIZE, marginVertical: 8 }} className="items-center justify-center">
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
            {/* Glow */}
            <AnimatedPath animatedProps={glowProps} strokeWidth={STROKE + 10} fill="none" strokeLinecap="round" />
            {/* Track */}
            <Path d={trackPath} stroke={trackColor} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
            {/* Fill */}
            <AnimatedPath animatedProps={fillProps} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          </Svg>

          <View className="items-center">
            <AnimatedTextInput
              animatedProps={textProps}
              editable={false}
              underlineColorAndroid="transparent"
              style={[{
                fontSize: 44,
                fontWeight: '900',
                letterSpacing: -2,
                textAlign: 'center',
                minWidth: 160,
                padding: 0,
                backgroundColor: 'transparent',
              }, textColorStyle]}
            />
            <Text className="text-[12px] font-semibold mt-1 uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Full
            </Text>
          </View>
        </View>
      </View>

      <View className="h-px bg-slate-200 dark:bg-white/10 mx-1 my-3" />

      <View className="flex-row pb-1">
        {storedMCM !== null && (
          <View className="flex-1 items-center">
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">Stored</Text>
            <Text className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{storedMCM.toFixed(0)}</Text>
            <Text className="text-[10px] text-slate-400 dark:text-slate-500">MCM</Text>
          </View>
        )}
        {totalCapacityInMCM ? (
          <View className="flex-1 items-center">
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">Capacity</Text>
            <Text className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{totalCapacityInMCM.toFixed(0)}</Text>
            <Text className="text-[10px] text-slate-400 dark:text-slate-500">MCM</Text>
          </View>
        ) : null}
        <View className="flex-1 items-center">
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">Updated</Text>
          <Text className="text-[13px] font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>{formattedDate}</Text>
        </View>
      </View>
    </GlassCard>
  );
}
