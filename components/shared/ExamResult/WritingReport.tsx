import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import { BandRing } from './ScoreHeader';

const { width: SCREEN_W } = Dimensions.get('window');

export interface WritingError {
  original: string;
  corrected: string;
  error_type: string;
  explanation_vi: string;
}

export interface RewriteSegment {
  original_segment: string;
  improved_segment: string;
  reason_vi: string;
}

export interface WritingAIFeedback {
  overall_score?: number;
  criteria_scores?: {
    task_response?: number;
    coherence_cohesion?: number;
    lexical_resource?: number;
    grammar_accuracy?: number;
    [key: string]: number | undefined;
  };
  feedback?: string;
  suggested_version?: string;
  word_count?: number;
  detailed_errors?: WritingError[];
  sample_rewrite_segments?: RewriteSegment[];
}

const CRITERIA_LABELS: Record<string, string> = {
  task_response: 'Task Response',
  coherence_cohesion: 'Coherence',
  lexical_resource: 'Lexical',
  grammar_accuracy: 'Grammar',
};

function bandColor(score: number): string {
  if (score >= 7) return '#059669';
  if (score >= 5.5) return '#0058be';
  if (score >= 4) return '#d97706';
  return '#ba1a1a';
}

interface Props {
  score: number;
  feedback?: WritingAIFeedback;
}

export function WritingReport({ score, feedback }: Props) {
  const band = feedback?.overall_score ?? score;
  const criteria = feedback?.criteria_scores ?? {};
  const criteriaEntries = Object.entries(criteria).filter(([, v]) => v != null);

  return (
    <View style={styles.container}>
      <BandRing band={band} />

      {feedback?.word_count && (
        <Text style={styles.wordCountText}>
          Số lượng từ: <Text style={{ fontWeight: '700' }}>{feedback.word_count}</Text>
        </Text>
      )}

      {criteriaEntries.length > 0 && (
        <View style={styles.criteriaGrid}>
          {criteriaEntries.map(([key, val]) => (
            <View key={key} style={styles.criteriaCard}>
              <Text style={styles.criteriaLabel}>
                {CRITERIA_LABELS[key] ?? key.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={[styles.criteriaScore, { color: bandColor(val as number) }]}>
                {(val as number).toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {feedback?.feedback ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Nhận xét chuyên gia</Text>
          <Text style={styles.feedbackBody}>{feedback.feedback}</Text>
        </View>
      ) : null}

      {feedback?.detailed_errors && feedback.detailed_errors.length > 0 && (
        <View style={styles.analysisBox}>
          <Text style={styles.sectionLabel}>PHÂN TÍCH LỖI NGỮ PHÁP</Text>
          {feedback.detailed_errors.map((err, i) => (
            <View key={i} style={styles.errorItem}>
              <View style={styles.errorHeader}>
                <Text style={styles.errorLabel}>Lỗi #{i + 1}</Text>
                <Text style={styles.errorType}>{err.error_type}</Text>
              </View>
              <Text style={styles.originalText}>"{err.original}"</Text>
              <Text style={styles.correctedText}>{err.corrected}</Text>
              <Text style={styles.explanationText}>💡 {err.explanation_vi}</Text>
            </View>
          ))}
        </View>
      )}

      {feedback?.sample_rewrite_segments && feedback.sample_rewrite_segments.length > 0 && (
        <View style={styles.analysisBox}>
          <Text style={styles.sectionLabel}>GỢI Ý NÂNG CẤP ĐOẠN VĂN</Text>
          {feedback.sample_rewrite_segments.map((seg, i) => (
            <View key={i} style={styles.rewriteItem}>
              <View style={styles.rewriteBox}>
                <Text style={styles.rewriteTag}>GỐC</Text>
                <Text style={styles.rewriteText}>{seg.original_segment}</Text>
              </View>
              <FontAwesome name="long-arrow-down" size={16} color={colors.primary} style={{ alignSelf: 'center', marginVertical: 4 }} />
              <View style={[styles.rewriteBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.rewriteTag, { color: '#059669' }]}>NÂNG CẤP (BAND 8.5+)</Text>
                <Text style={[styles.rewriteText, { color: '#064E3B' }]}>{seg.improved_segment}</Text>
              </View>
              <Text style={styles.explanationText}>✨ {seg.reason_vi}</Text>
            </View>
          ))}
        </View>
      )}

      {feedback?.suggested_version ? (
        <View style={styles.suggestedCard}>
          <View style={styles.suggestedHeader}>
            <FontAwesome name="star" size={14} color="#065F46" />
            <Text style={styles.suggestedTitle}>Bài mẫu Band 8.5+</Text>
          </View>
          <Text style={styles.suggestedBody}>{feedback.suggested_version}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', gap: spacing.md },
  wordCountText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  criteriaGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.sm, width: '100%',
    justifyContent: 'space-between',
  },
  criteriaCard: {
    width: (SCREEN_W - spacing.lg * 2 - spacing.sm) / 2 - 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', ...shadow.card,
  },
  criteriaLabel: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textAlign: 'center', marginBottom: spacing.xs,
  },
  criteriaScore: { fontSize: 22, fontWeight: '800' },
  feedbackCard: {
    width: '100%', backgroundColor: colors.primary,
    borderRadius: radius.xl, padding: spacing.lg,
  },
  feedbackTitle: {
    ...typography.h3, color: '#fff', marginBottom: spacing.sm,
  },
  feedbackBody: {
    ...typography.body, color: '#dbeafe', lineHeight: 22,
  },
  analysisBox: { width: '100%', gap: spacing.md, marginTop: spacing.sm },
  errorItem: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  errorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  errorLabel: { fontSize: 11, fontWeight: '800', color: colors.error },
  errorType: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  originalText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 4 },
  correctedText: { fontSize: 14, color: colors.success, fontWeight: '700', marginBottom: 6 },
  explanationText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  rewriteItem: { gap: spacing.xs, marginBottom: spacing.sm },
  rewriteBox: { backgroundColor: colors.surfaceVariant, padding: spacing.md, borderRadius: radius.md },
  rewriteTag: { fontSize: 9, fontWeight: '900', color: colors.textMuted, marginBottom: 4 },
  rewriteText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  suggestedCard: {
    width: '100%', backgroundColor: colors.successBg,
    borderWidth: 1.5, borderColor: '#A7F3D0',
    borderRadius: radius.xl, padding: spacing.lg,
  },
  suggestedHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, marginBottom: spacing.sm,
  },
  suggestedTitle: { ...typography.h3, color: '#065F46' },
  suggestedBody: {
    ...typography.body, color: '#047857', lineHeight: 24,
  },
});
