import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type ProgressBarProps = {
  progress: number;
  showLabel?: boolean;
};

export function ProgressBar({ progress, showLabel = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      {showLabel ? <Text style={styles.label}>{Math.round(pct)}%</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, minWidth: 36 },
});
