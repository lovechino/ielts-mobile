import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { MatchDropdown } from '@/components/reading/atoms/MatchDropdown';

interface MatchingListeningGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
}

function parseOptions(group: QuestionGroupDTO): Array<{ id: string; text: string }> {
  if (group.options_pool && Array.isArray(group.options_pool)) {
    return group.options_pool.map((o: any) => ({
      id: o.id || String(o),
      text: o.text || String(o),
    }));
  }
  return [];
}

interface MatchingListeningGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
  startIndex?: number;
}

export function MatchingListeningGroup({ group, questions, answers, onAnswer, activeQuestionNumber, startIndex = 0 }: MatchingListeningGroupProps) {
  const options = useMemo(() => parseOptions(group), [group.options_pool]);

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Matching'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      <View style={styles.optionsPool}>
        {options.map((o) => (
          <View key={o.id} style={styles.optItem}>
            <Text style={styles.optId}>{o.id}.</Text>
            <Text style={styles.optText}>{o.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.questions}>
        {questions.map((q, idx) => {
          const globalNum = startIndex + idx + 1;
          const isActive = activeQuestionNumber === globalNum;
          return (
            <View key={q.id} style={[styles.qRow, isActive && styles.qActive]}>
              <Text style={styles.qNum}>{globalNum}.</Text>
              <Text style={styles.qText}>{q.content}</Text>
              <MatchDropdown
                options={options}
                selected={answers[q.id] || ''}
                onSelect={(val) => onAnswer(q.id, val)}
                placeholder="Select"
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
  optionsPool: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    backgroundColor: colors.primaryFixed, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  optItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  optId: { fontSize: 13, fontWeight: '700', color: colors.text },
  optText: { fontSize: 13, color: colors.textSecondary },
  questions: { gap: spacing.md },
  qRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent',
  },
  qActive: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
