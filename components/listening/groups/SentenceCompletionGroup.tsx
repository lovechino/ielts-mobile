import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';

interface SentenceCompletionGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
}

export function SentenceCompletionGroup({ group, questions, answers, onAnswer, activeQuestionNumber }: SentenceCompletionGroupProps) {
  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Sentence Completion'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.questions}>
        {questions.map((q, idx) => {
          const isActive = activeQuestionNumber === idx + 1;
          const qNum = idx + 1;
          return (
            <View key={q.id} style={[styles.qRow, isActive && styles.qActive]}>
              <Text style={styles.qNum}>{qNum}.</Text>
              <Text style={styles.qText}>{q.content}</Text>
              <TextInput
                style={[styles.input, answers[q.id] ? styles.inputFilled : null, isActive && styles.inputActive]}
                value={answers[q.id] || ''}
                onChangeText={(t) => onAnswer(q.id, t)}
                placeholder="______"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          );
        })}
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
  questions: { gap: spacing.md },
  qRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent',
  },
  qActive: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qText: { fontSize: 14, color: colors.text, lineHeight: 20, flex: 1 },
  input: {
    borderBottomWidth: 2, borderBottomColor: colors.border,
    paddingVertical: 2, paddingHorizontal: spacing.xs,
    fontSize: 15, color: colors.text, minWidth: 90,
  },
  inputFilled: { borderBottomColor: colors.primary, fontWeight: '600' },
  inputActive: { borderBottomColor: colors.primary },
});
