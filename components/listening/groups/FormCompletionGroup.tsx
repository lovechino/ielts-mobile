import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { FormField } from '../atoms/FormField';

interface FormCompletionGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
}

export function FormCompletionGroup({ group, questions, answers, onAnswer, activeQuestionNumber }: FormCompletionGroupProps) {
  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Form Completion'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.form}>
        {questions.map((q, idx) => (
          <FormField
            key={q.id}
            label={q.content || `Question ${idx + 1}`}
            value={answers[q.id] || ''}
            onChangeText={(t) => onAnswer(q.id, t)}
            questionNumber={idx + 1}
            isActive={activeQuestionNumber === idx + 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadow.card,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  form: { gap: spacing.xs, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, padding: spacing.sm },
});
