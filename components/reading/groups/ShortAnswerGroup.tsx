import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';

interface ShortAnswerGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

export function ShortAnswerGroup({ group, questions, answers, onAnswer }: ShortAnswerGroupProps) {
  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Short Answer Questions'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.questions}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.questionRow}>
            <Text style={styles.qNum}>{idx + 1}.</Text>
            <View style={styles.qContent}>
              <Text style={styles.qText}>{q.content}</Text>
              <TextInput
                style={[styles.input, answers[q.id] ? styles.inputFilled : null]}
                placeholder="Type your answer"
                placeholderTextColor={colors.textMuted}
                value={answers[q.id] || ''}
                onChangeText={(t) => onAnswer(q.id, t)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
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
  title: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  questions: { gap: spacing.md },
  questionRow: { flexDirection: 'row' },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28, marginTop: spacing.sm },
  qContent: { flex: 1 },
  qText: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm, fontSize: 15, color: colors.text,
    backgroundColor: colors.surfaceContainerLow,
  },
  inputFilled: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
});
