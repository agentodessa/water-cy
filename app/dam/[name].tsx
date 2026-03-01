import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FillBar } from '../../components/FillBar';
import { GlassCard } from '../../components/GlassCard';
import { useDams } from '../../hooks/useDams';
import { useDateStatistics } from '../../hooks/useDateStatistics';
import { usePercentages } from '../../hooks/usePercentages';
import { formatMCM, formatPercentage } from '../../lib/format';
import { getFillColor } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading…</Text>
      </View>
    );
  }

  const capacityMCM = dam.capacity / 1_000_000;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Image header */}
      <View style={styles.imageContainer}>
        {dam.imageUrl
          ? <Image source={{ uri: dam.imageUrl }} style={styles.image} />
          : <View style={[styles.image, { backgroundColor: colors.surface }]} />}

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 8 }]}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Glass overlay */}
        <GlassCard style={styles.imageOverlay} padding={16}>
          <Text style={styles.overlayName}>{dam.nameEn}</Text>
          <Text style={[styles.overlayPct, { color: getFillColor(pct) }]}>{formatPercentage(pct)}</Text>
          <Text style={styles.overlaySub}>{formatMCM(storageMCM)} / {formatMCM(capacityMCM)}</Text>
          <FillBar percentage={pct} height={6} />
        </GlassCard>
      </View>

      {/* Stats grid */}
      <View style={styles.statsRow}>
        {[
          { label: 'Height',       value: `${dam.height}m` },
          { label: 'Built',        value: `${dam.yearOfConstruction}` },
          { label: 'Inflow today', value: `${inflowMCM.toFixed(3)} MCM` },
          { label: 'Type',         value: dam.typeEl },
        ].map(stat => (
          <View key={stat.label} style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* River info */}
      <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
        <Ionicons name="water" size={16} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.text }]}>River: {dam.riverNameEl}</Text>
      </View>

      {/* Wikipedia link */}
      {dam.wikipediaUrl ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(dam.wikipediaUrl)}
          style={[styles.wikiBtn, { borderColor: colors.accent }]}
        >
          <Text style={[styles.wikiText, { color: colors.accent }]}>View on Wikipedia →</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { position: 'relative' },
  image:          { width: '100%', height: 260, resizeMode: 'cover' },
  backBtn:        { position: 'absolute', left: 16, borderRadius: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  imageOverlay:   { position: 'absolute', bottom: 16, left: 16, right: 16 },
  overlayName:    { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  overlayPct:     { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  overlaySub:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
  statsRow:       { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statBox:        { width: '47%', borderRadius: 12, padding: 12 },
  statLabel:      { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  statValue:      { fontSize: 15, fontWeight: '700' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 8 },
  infoText:       { fontSize: 13 },
  wikiBtn:        { marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  wikiText:       { fontSize: 14, fontWeight: '600' },
});
