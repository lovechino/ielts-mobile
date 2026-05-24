import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';

interface NoteCompletionGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
}

export function NoteCompletionGroup({ group, questions, answers, onAnswer, activeQuestionNumber }: NoteCompletionGroupProps) {
  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Note Completion'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.notes}>
        {questions.map((q, idx) => {
          const isActive = activeQuestionNumber === idx + 1;
          return (
            <View key={q.id} style={[styles.noteRow, isActive && styles.noteActive]}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.noteText}>{q.content}</Text>
              <TextInput
                style={[styles.input, answers[q.id] ? styles.inputFilled : null, isActive && styles.inputActive]}
                value={answers[q.id] || ''}
                onChangeText={(t) => onAnswer(q.id, t)}
                placeholder="___"
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
  notes: { gap: spacing.sm },
  noteRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent',
  },
  noteActive: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  bullet: { fontSize: 16, color: colors.secondary, width: 12 },
  noteText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
  input: {
    borderBottomWidth: 2, borderBottomColor: colors.border,
    paddingVertical: 2, paddingHorizontal: spacing.xs,
    fontSize: 15, color: colors.text, minWidth: 80,
  },
  inputFilled: { borderBottomColor: colors.primary, fontWeight: '600' },
  inputActive: { borderBottomColor: colors.primary },
});
