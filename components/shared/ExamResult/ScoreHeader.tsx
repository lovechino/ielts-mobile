import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, shadow } from '@/theme/tokens';

function bandColor(score: number): string {
  if (score >= 7) return '#059669';
  if (score >= 5.5) return '#0058be';
  if (score >= 4) return '#d97706';
  return '#ba1a1a';
}

export function ScoreRing({ score, total, pct }: { score: number; total: number; pct: number }) {
  const color = pct >= 70 ? colors.tertiary : pct >= 50 ? colors.primary : colors.secondary;
  return (
    <View style={ring.wrapper}>
      <View style={[ring.outer, { borderColor: color }]}>
        <View style={ring.inner}>
          <Text style={[ring.scoreText, { color }]}>{score}</Text>
          <Text style={ring.divider}>/{total}</Text>
        </View>
      </View>
      <Text style={[ring.pctText, { color }]}>{pct}%</Text>
    </View>
  );
}

export function BandRing({ band }: { band: number }) {
  const color = bandColor(band);
  return (
    <View style={[bandRing.outer, { borderColor: color }]}>
      <Text style={[bandRing.text, { color }]}>{band.toFixed(1)}</Text>
      <Text style={bandRing.label}>Band</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.xs },
  outer: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  inner: { alignItems: 'center' },
  scoreText: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  divider: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  pctText: { fontSize: 15, fontWeight: '700' },
});

const bandRing = StyleSheet.create({
  outer: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, ...shadow.card,
  },
  text: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: -2 },
});
