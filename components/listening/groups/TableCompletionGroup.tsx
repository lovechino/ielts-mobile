import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';

interface TableCompletionGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
  startIndex?: number;
}

export function TableCompletionGroup({ group, questions, answers, onAnswer, activeQuestionNumber, startIndex = 0 }: TableCompletionGroupProps) {
  const cols = 3;
  const rows = Math.ceil(questions.length / (cols - 1));

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Table Completion'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.table}>
        {group.content_template ? (
          <View style={styles.headerRow}>
            {group.content_template.split('|').map((h, i) => (
              <Text key={i} style={[styles.cell, styles.headerCell, i === 0 && styles.cellFirst]}>{h.trim()}</Text>
            ))}
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {Array.from({ length: Math.max(1, rows) }).map((_, rIdx) => {
            const rowQs = questions.slice(rIdx * (cols - 1), (rIdx + 1) * (cols - 1));
            return (
              <View key={rIdx} style={styles.dataRow}>
                <Text style={[styles.cell, styles.cellFirst]}>{startIndex + rIdx * (cols - 1) + 1}</Text>
                {Array.from({ length: cols - 1 }).map((_, cIdx) => {
                  const q = rowQs[cIdx];
                  if (!q) return <View key={cIdx} style={[styles.cell, styles.cellEmpty]} />;
                  const globalNum = startIndex + (rIdx * (cols - 1)) + cIdx + 1;
                  const isActive = activeQuestionNumber === globalNum;
                  return (
                    <View key={q.id} style={[styles.cell, isActive && styles.cellActive]}>
                      <TextInput
                        style={[styles.tableInput, answers[q.id] ? styles.inputFilled : null]}
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
            );
          })}
        </View>
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
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', backgroundColor: colors.primaryFixed },
  dataRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border },
  cell: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRightWidth: 1, borderColor: colors.border,
    justifyContent: 'center',
  },
  cellFirst: { flex: 0.6, alignItems: 'center' },
  cellActive: { backgroundColor: colors.primaryFixed },
  cellEmpty: { backgroundColor: colors.surfaceContainerLow },
  headerCell: { fontWeight: '700', fontSize: 12, color: colors.primary, textAlign: 'center' },
  tableInput: {
    borderBottomWidth: 1.5, borderBottomColor: colors.border,
    paddingVertical: 2, fontSize: 14, color: colors.text, textAlign: 'center',
  },
  inputFilled: { borderBottomColor: colors.primary, fontWeight: '600' },
});
