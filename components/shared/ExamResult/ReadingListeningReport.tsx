import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { ProgressResultItem } from '@/lib/api/types';
import { ScoreRing } from './ScoreHeader';

interface Props {
  score: number;
  totalQuestions: number;
  results: ProgressResultItem[];
}

export function ReadingListeningReport({ score, totalQuestions, results }: Props) {
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  return (
    <View style={styles.container}>
      <ScoreRing score={score} total={totalQuestions} pct={pct} />

      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: colors.successBg }]}>
          <FontAwesome name="check" size={12} color={colors.success} />
          <Text style={[styles.chipText, { color: colors.success }]}>
            {results.filter((r) => r.is_correct).length} Correct
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.errorBg }]}>
          <FontAwesome name="times" size={12} color={colors.error} />
          <Text style={[styles.chipText, { color: colors.error }]}>
            {results.filter((r) => !r.is_correct).length} Wrong
          </Text>
        </View>
      </View>

      {results.length > 0 && (
        <View style={styles.breakdownBox}>
          <Text style={styles.sectionLabel}>ANSWER REVIEW</Text>
          {results.map((r, i) => (
            <View key={r.question_id || i} style={styles.resultRow}>
              <Text style={styles.qNum}>Q{i + 1}</Text>
              <FontAwesome
                name={r.is_correct ? 'check-circle' : 'times-circle'}
                size={16}
                color={r.is_correct ? colors.success : colors.error}
              />
              <Text style={styles.yourAnswer} numberOfLines={1}>
                {r.answer || '—'}
              </Text>
              {!r.is_correct && r.correct_answer ? (
                <Text style={styles.correctAnswer} numberOfLines={1}>
                  → {r.correct_answer}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', gap: spacing.md },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  breakdownBox: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.xs, ...shadow.card,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1.5, marginBottom: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: 3,
  },
  qNum: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, width: 28 },
  yourAnswer: { fontSize: 13, color: colors.text, flex: 1 },
  correctAnswer: { fontSize: 12, color: colors.success, fontWeight: '600', flex: 1 },
});
