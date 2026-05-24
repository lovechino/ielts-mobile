import { View, Text, StyleSheet } from 'react-native';
import { TFNGSelector } from '../atoms/TFNGSelector';
import { colors, spacing, radius } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';

interface TFNGGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

const LABELS: Record<string, string[]> = {
  TRUE_FALSE_NOT_GIVEN: ['TRUE', 'FALSE', 'NOT GIVEN'],
  YES_NO_NOT_GIVEN: ['YES', 'NO', 'NOT GIVEN'],
};

export function TFNGGroup({ group, questions, answers, onAnswer }: TFNGGroupProps) {
  const labels = LABELS[group.group_type || 'TRUE_FALSE_NOT_GIVEN'] || LABELS.TRUE_FALSE_NOT_GIVEN;

  return (
    <View style={styles.groupCard}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.title || 'True / False / Not Given'}</Text>
      </View>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.questions}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.questionRow}>
            <Text style={styles.qNum}>{idx + 1}.</Text>
            <Text style={styles.qContent}>{q.content}</Text>
            <TFNGSelector
              labels={labels}
              selected={answers[q.id] || ''}
              onSelect={(val) => onAnswer(q.id, val)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: { marginBottom: spacing.sm },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  questions: { gap: spacing.md },
  questionRow: { gap: spacing.xs },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qContent: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: spacing.xs },
});
