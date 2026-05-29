import { useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import type { ProgressResultItem } from '@/lib/api/types';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface ExamResultModalProps {
  visible: boolean;
  lessonTitle: string;
  /** 'reading' | 'listening' | 'writing' */
  lessonType: 'reading' | 'listening' | 'writing';
  score: number;
  totalQuestions: number;
  results: ProgressResultItem[];
  /** Only for writing */
  writingFeedback?: WritingAIFeedback;
  onDone: () => void;
  onRetake?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function ScoreRing({ score, total, pct }: { score: number; total: number; pct: number }) {
  const color = pct >= 70 ? colors.tertiary : pct >= 50 ? colors.primary : colors.secondary;
  return (
    <View style={ring.wrapper}>
      <View style={[ring.outer, { borderColor: color }]}>
        <View style={ring.inner}>
          <Text style={[ring.scoreText, { color }]}>{score}</Text>
          <Text style={ring.divider}>/{total}</Text>
        </View>
      </View>
      <Text style={[ring.pctText, { color }]}>{pct}%</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.xs },
  outer: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  inner: { alignItems: 'center' },
  scoreText: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  divider: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  pctText: { fontSize: 15, fontWeight: '700' },
});

function BandRing({ band }: { band: number }) {
  const color = bandColor(band);
  return (
    <View style={[bandRing.outer, { borderColor: color }]}>
      <Text style={[bandRing.text, { color }]}>{band.toFixed(1)}</Text>
      <Text style={bandRing.label}>Band</Text>
    </View>
  );
}

const bandRing = StyleSheet.create({
  outer: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, ...shadow.card,
  },
  text: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: -2 },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExamResultModal({
  visible, lessonTitle, lessonType,
  score, totalQuestions, results,
  writingFeedback, onDone, onRetake,
}: ExamResultModalProps) {
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const isWriting = lessonType === 'writing';

  const renderReadingListeningResult = useCallback(() => (
    <>
      {/* Score ring */}
      <ScoreRing score={score} total={totalQuestions} pct={pct} />

      {/* Summary chips */}
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

      {/* Per-question breakdown */}
      {results.length > 0 && (
        <View style={styles.breakdownBox}>
          <Text style={styles.sectionLabel}>ANSWER REVIEW</Text>
          {results.map((r, i) => (
            <View key={r.question_id} style={styles.resultRow}>
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
    </>
  ), [score, totalQuestions, pct, results]);

  const renderWritingResult = useCallback(() => {
    const band = writingFeedback?.overall_score ?? score;
    const criteria = writingFeedback?.criteria_scores ?? {};
    const criteriaEntries = Object.entries(criteria).filter(([, v]) => v != null);

    return (
      <>
        {/* Band ring */}
        <BandRing band={band} />

        {/* Word count info */}
        {writingFeedback?.word_count && (
          <Text style={styles.wordCountText}>
            Số lượng từ: <Text style={{ fontWeight: '700' }}>{writingFeedback.word_count}</Text>
          </Text>
        )}

        {/* Criteria grid */}
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

        {/* AI Feedback */}
        {writingFeedback?.feedback ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Nhận xét chuyên gia</Text>
            <Text style={styles.feedbackBody}>{writingFeedback.feedback}</Text>
          </View>
        ) : null}

        {/* Detailed Errors Analysis */}
        {writingFeedback?.detailed_errors && writingFeedback.detailed_errors.length > 0 && (
          <View style={styles.analysisBox}>
            <Text style={styles.sectionLabel}>PHÂN TÍCH LỖI NGỮ PHÁP</Text>
            {writingFeedback.detailed_errors.map((err, i) => (
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

        {/* Sample Rewrite Segments */}
        {writingFeedback?.sample_rewrite_segments && writingFeedback.sample_rewrite_segments.length > 0 && (
          <View style={styles.analysisBox}>
            <Text style={styles.sectionLabel}>GỢI Ý NÂNG CẤP ĐOẠN VĂN</Text>
            {writingFeedback.sample_rewrite_segments.map((seg, i) => (
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

        {/* Suggested version */}
        {writingFeedback?.suggested_version ? (
          <View style={styles.suggestedCard}>
            <View style={styles.suggestedHeader}>
              <FontAwesome name="star" size={14} color="#065F46" />
              <Text style={styles.suggestedTitle}>Bài mẫu Band 8.5+</Text>
            </View>
            <Text style={styles.suggestedBody}>{writingFeedback.suggested_version}</Text>
          </View>
        ) : null}
      </>
    );
  }, [writingFeedback, score]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <FontAwesome
              name={isWriting ? 'pencil' : 'check-circle'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>{lessonTitle}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isWriting ? renderWritingResult() : renderReadingListeningResult()}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {onRetake && (
              <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
                <FontAwesome name="refresh" size={14} color={colors.primary} />
                <Text style={styles.retakeBtnText}>Làm lại</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
              <Text style={styles.doneBtnText}>Hoàn thành</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    maxHeight: '92%',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  headerTitle: {
    flex: 1, fontSize: 16, fontWeight: '700', color: colors.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },

  // Chips
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  // Breakdown
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

  // Writing criteria
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

  // AI Feedback card
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

  // New Analysis Styles
  wordCountText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
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

  // Suggested version
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

  // Actions
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.primary,
  },
  retakeBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  doneBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg, backgroundColor: colors.primary,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
