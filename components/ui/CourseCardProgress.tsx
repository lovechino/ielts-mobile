import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type CourseCardProgressProps = {
  title: string;
  progress: number;
  borderColor: string;
  onPress?: () => void;
};

export function CourseCardProgress({ title, progress, borderColor, onPress }: CourseCardProgressProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: borderColor }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressBg: { flex: 1, height: 8, backgroundColor: colors.surfaceContainer, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
});
