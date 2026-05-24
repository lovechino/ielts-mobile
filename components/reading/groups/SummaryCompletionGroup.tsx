import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { InlineInput } from '../atoms/InlineInput';
import { WordBankPanel } from '../atoms/WordBankPanel';

interface SummaryCompletionGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

function parseWordBank(group: QuestionGroupDTO): string[] {
  if (group.options_pool && Array.isArray(group.options_pool)) {
    return group.options_pool.map((o: any) => (typeof o === 'string' ? o : o.text || o.id || ''));
  }
  return [];
}

export function SummaryCompletionGroup({ group, questions, answers, onAnswer }: SummaryCompletionGroupProps) {
  const wordBank = useMemo(() => parseWordBank(group), [group.options_pool]);
  const hasWordBank = wordBank.length > 0;
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  const usedWords = useMemo(() => {
    if (!hasWordBank) return [];
    return Object.values(answers).filter((v) => v && wordBank.includes(v));
  }, [answers, hasWordBank, wordBank]);

  const handleWordBankSelect = useCallback((word: string) => {
    const emptyQ = questions.find((q) => !answers[q.id] || answers[q.id] === '');
    if (emptyQ) onAnswer(emptyQ.id, word);
  }, [questions, answers, onAnswer]);

  const handleFreeText = useCallback((questionId: string, text: string) => {
    setFreeTexts((prev) => ({ ...prev, [questionId]: text }));
    onAnswer(questionId, text);
  }, [onAnswer]);

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Summary Completion'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      {hasWordBank && (
        <WordBankPanel words={wordBank} usedWords={usedWords} onSelect={handleWordBankSelect} />
      )}

      <View style={styles.questions}>
        {questions.map((q, idx) => {
          const value = answers[q.id] || '';
          const placeholder = hasWordBank ? 'Select from bank' : `Answer ${idx + 1}`;
          return (
            <View key={q.id} style={styles.questionRow}>
              <Text style={styles.qNum}>{idx + 1}.</Text>
              <View style={styles.qContent}>
                <Text style={styles.qText}>{q.content}</Text>
                {hasWordBank ? (
                  <View style={styles.bankSelectArea}>
                    <View style={styles.selectedWordDisplay}>
                      <Text style={[styles.selectedWordText, !value && styles.placeholderText]}>
                        {value || placeholder}
                      </Text>
                    </View>
                    {value ? (
                      <Text style={styles.clearLink} onPress={() => onAnswer(q.id, '')}>✕</Text>
                    ) : null}
                  </View>
                ) : (
                  <InlineInput
                    value={freeTexts[q.id] ?? value}
                    onChangeText={(t) => handleFreeText(q.id, t)}
                    placeholder={placeholder}
                  />
                )}
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
    marginBottom: spacing.md, ...shadow.card,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  questions: { gap: spacing.md },
  questionRow: { flexDirection: 'row' },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28, marginTop: spacing.xs },
  qContent: { flex: 1, gap: spacing.xs },
  qText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bankSelectArea: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectedWordDisplay: {
    flex: 1, paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow, minHeight: 36,
    justifyContent: 'center',
  },
  selectedWordText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  placeholderText: { color: colors.textMuted, fontWeight: '400' },
  clearLink: { fontSize: 16, color: colors.error, fontWeight: '700', padding: spacing.xs },
});
