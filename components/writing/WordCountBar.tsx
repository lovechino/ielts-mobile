import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface WordCountBarProps {
  current: number;
  min: number;
  recommended?: number;
}

function getZone(current: number, min: number, recommended: number): { color: string; bg: string; label: string; pct: number } {
  if (current < min * 0.6) return { color: colors.error, bg: colors.errorContainer, label: 'Too short', pct: (current / min) * 50 };
  if (current < min) return { color: colors.secondary, bg: colors.secondaryFixedDim, label: 'Keep going', pct: 50 + (current - min * 0.6) / (min * 0.4) * 25 };
  if (current >= min && current < recommended) return { color: colors.tertiary, bg: colors.tertiaryFixed, label: 'Good', pct: 75 };
  if (current >= recommended && current <= min * 1.7) return { color: colors.tertiary, bg: colors.tertiaryFixed, label: 'Excellent', pct: 90 };
  return { color: colors.secondary, bg: colors.secondaryFixedDim, label: 'Consider trimming', pct: 95 };
}

export function WordCountBar({ current, min, recommended }: WordCountBarProps) {
  const rec = recommended || Math.round(min * 1.3);
  const zone = getZone(current, min, rec);
  const totalRange = min * 1.7;
  const pct = Math.min(100, (current / totalRange) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.zone0, { left: '0%', width: `${(min * 0.6 / totalRange) * 100}%` }]} />
        <View style={[styles.zone1, { left: `${(min * 0.6 / totalRange) * 100}%`, width: `${((min - min * 0.6) / totalRange) * 100}%` }]} />
        <View style={[styles.zone2, { left: `${(min / totalRange) * 100}%`, width: `${((rec - min) / totalRange) * 100}%` }]} />
        <View style={[styles.zone3, { left: `${(rec / totalRange) * 100}%`, width: `${((min * 1.7 - rec) / totalRange) * 100}%` }]} />
        <View style={[styles.indicator, { left: `${Math.min(pct, 98)}%` }]} />
      </View>
      <Text style={[styles.badge, { backgroundColor: zone.bg, color: zone.color }]}>{zone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: { flex: 1, height: 8, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.surfaceContainerHigh, position: 'relative' },
  zone0: { position: 'absolute', height: '100%', backgroundColor: colors.errorContainer },
  zone1: { position: 'absolute', height: '100%', backgroundColor: colors.secondaryFixedDim },
  zone2: { position: 'absolute', height: '100%', backgroundColor: colors.tertiaryFixed },
  zone3: { position: 'absolute', height: '100%', backgroundColor: colors.secondaryFixedDim },
  indicator: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, top: -2, borderWidth: 2, borderColor: '#fff',
  },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, fontSize: 11, fontWeight: '700' },
});
