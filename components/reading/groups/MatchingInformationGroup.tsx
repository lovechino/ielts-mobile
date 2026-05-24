import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { MatchDropdown } from '../atoms/MatchDropdown';

interface MatchingInformationGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  variant?: 'information' | 'features';
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

export function MatchingInformationGroup({ group, questions, answers, onAnswer, variant = 'information' }: MatchingInformationGroupProps) {
  const options = useMemo(() => parseOptions(group), [group.options_pool]);
  const poolLabel = variant === 'features' ? 'List of People / Places' : 'List of Paragraphs';
  const qPrefix = variant === 'features' ? 'Feature' : 'Statement';

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>
        {group.title || (variant === 'features' ? 'Matching Features' : 'Matching Information')}
      </Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      <View style={styles.poolSection}>
        <Text style={styles.poolLabel}>{poolLabel}</Text>
        <View style={styles.poolCol}>
          {options.map((o) => (
            <View key={o.id} style={styles.poolItem}>
              <Text style={styles.poolId}>{o.id}</Text>
              <Text style={styles.poolText} numberOfLines={1}>{o.text}</Text>
            </View>
          ))}
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
              placeholder={qPrefix}
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
  poolCol: { gap: 3 },
  poolItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  poolId: { fontSize: 13, fontWeight: '700', color: colors.text, width: 24 },
  poolText: { fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 16 },
  questions: { gap: spacing.md },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qContent: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
