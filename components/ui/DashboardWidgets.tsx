import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type Props = {
  stats: {
    total_vocab: number;
    vocab_learned: number;
    overall_progress_pct: number;
  };
};

export default function DashboardWidgets({ stats }: Props) {
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.value}>{stats.total_vocab}</Text>
        <Text style={styles.label}>Từ vựng</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{stats.vocab_learned}</Text>
        <Text style={styles.label}>Đã học</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{stats.overall_progress_pct}%</Text>
        <Text style={styles.label}>Tiến độ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.card,
  },
  value: { fontSize: 24, fontWeight: '700', color: colors.primary },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
});
