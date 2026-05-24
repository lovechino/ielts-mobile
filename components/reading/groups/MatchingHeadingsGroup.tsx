import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { MatchDropdown } from '../atoms/MatchDropdown';

interface MatchingHeadingsGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
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

export function MatchingHeadingsGroup({ group, questions, answers, onAnswer }: MatchingHeadingsGroupProps) {
  const options = useMemo(() => parseOptions(group), [group.options_pool]);

  const usedOptions = useMemo(() => {
    return Object.values(answers).filter(Boolean);
  }, [answers]);

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Matching Headings'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      <View style={styles.poolSection}>
        <Text style={styles.poolLabel}>List of Headings</Text>
        <View style={styles.poolCol}>
          {options.map((o) => {
            const usedCount = usedOptions.filter((v) => v === o.id).length;
            return (
              <View key={o.id} style={[styles.poolItem, usedCount > 0 && styles.poolItemUsed]}>
                <Text style={styles.poolId}>{o.id}.</Text>
                <Text style={[styles.poolText, usedCount > 0 && { color: colors.textMuted }]}>{o.text}</Text>
                {usedCount > 0 ? <Text style={styles.usedCount}>Used {usedCount > 1 ? `(${usedCount}x)` : ''}</Text> : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.questions}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.questionRow}>
            <Text style={styles.qNum}>{idx + 1}.</Text>
            <Text style={styles.qContent}>{q.content}</Text>
            <MatchDropdown
              options={options}
              selected={answers[q.id] || ''}
              onSelect={(val) => onAnswer(q.id, val)}
              usedOptions={usedOptions.filter((v) => v !== answers[q.id])}
              placeholder="Heading"
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
    marginBottom: spacing.md, ...shadow.card,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  poolSection: {
    backgroundColor: colors.primaryFixed, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  poolLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, marginBottom: spacing.xs },
  poolCol: { gap: 4 },
  poolItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    paddingVertical: 3,
  },
  poolItemUsed: { opacity: 0.6 },
  poolId: { fontSize: 13, fontWeight: '700', color: colors.text, width: 24 },
  poolText: { fontSize: 13, color: colors.text, flex: 1, lineHeight: 18 },
  usedCount: { fontSize: 10, color: colors.secondary, fontWeight: '600' },
  questions: { gap: spacing.md },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qContent: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
