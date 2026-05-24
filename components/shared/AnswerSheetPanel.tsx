import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useTestStore } from '@/stores/useTestStore';

const COLS = 8;

export function AnswerSheetPanel({ onJumpTo }: { onJumpTo: (qNum: number) => void }) {
  const { getAllQuestions, answers } = useTestStore();
  const allQuestions = getAllQuestions();

  if (allQuestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Answer Sheet</Text>
      <View style={styles.grid}>
        {allQuestions.map((q, idx) => {
          const qNum = idx + 1;
          const answered = answers[q.id] !== undefined && answers[q.id] !== '';
          return (
            <TouchableOpacity
              key={q.id}
              style={[styles.dot, answered && styles.dotAnswered]}
              onPress={() => onJumpTo(qNum)}
            >
              <Text style={[styles.dotText, answered && styles.dotTextAnswered]}>{qNum}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  title: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  dotAnswered: { backgroundColor: colors.primary },
  dotText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  dotTextAnswered: { color: '#fff' },
});
