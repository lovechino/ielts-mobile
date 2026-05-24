import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';

interface MCGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

function parseMaxSelect(instruction?: string | null): number {
  if (!instruction) return 1;
  const match = instruction.match(/choose\s+(one|two|three)/i);
  if (!match) return 1;
  const map: Record<string, number> = { one: 1, two: 2, three: 3 };
  return map[match[1].toLowerCase()] || 1;
}

export function MCGroup({ group, questions, answers, onAnswer }: MCGroupProps) {
  const isMulti = group.group_type === 'MULTIPLE_CHOICE_MULTIPLE';
  const maxSelect = useMemo(() => parseMaxSelect(group.instruction), [group.instruction]);

  const toggleMulti = (questionId: string, key: string) => {
    const current = answers[questionId] || '';
    const selected = current ? current.split(',') : [];
    if (selected.includes(key)) {
      onAnswer(questionId, selected.filter((s) => s !== key).join(','));
    } else if (selected.length < maxSelect) {
      onAnswer(questionId, [...selected, key].join(','));
    }
  };

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Multiple Choice'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}
      <View style={styles.questions}>
        {questions.map((q, idx) => {
          const options = q.options;
          const parsed: Record<string, string> =
            typeof options === 'object' && options !== null
              ? options
              : {};

          return (
            <View key={q.id} style={styles.questionBlock}>
              <View style={styles.qHeader}>
                <Text style={styles.qNum}>{idx + 1}.</Text>
                <Text style={styles.qContent}>{q.content}</Text>
              </View>
              <View style={styles.options}>
                {Object.entries(parsed).map(([key, value]) => {
                  const selected = isMulti
                    ? (answers[q.id] || '').split(',').includes(key)
                    : answers[q.id] === key;
                  const isDisabled = isMulti && !selected && (answers[q.id] || '').split(',').length >= maxSelect;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.option, selected && styles.optionSelected, isDisabled && styles.optionDisabled]}
                      onPress={() => isMulti ? toggleMulti(q.id, key) : onAnswer(q.id, key)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.optKey}>{key}.</Text>
                      <Text style={[styles.optText, selected && styles.optTextSelected]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
    marginBottom: spacing.md,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  questions: { gap: spacing.lg },
  questionBlock: { gap: spacing.sm },
  qHeader: { flexDirection: 'row' },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qContent: { fontSize: 14, color: colors.text, lineHeight: 20, flex: 1 },
  options: { gap: spacing.xs, marginLeft: spacing.lg },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  optionDisabled: { opacity: 0.4 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.outline,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optKey: { fontSize: 14, fontWeight: '700', color: colors.text, width: 16 },
  optText: { fontSize: 14, color: colors.text, flex: 1 },
  optTextSelected: { fontWeight: '600' },
});
