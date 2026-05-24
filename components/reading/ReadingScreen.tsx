import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useTestStore } from '@/stores/useTestStore';
import type { GroupedQuestion } from '@/stores/useTestStore';
import type { LessonDTO } from '@/lib/api/types';
import { PassageViewer } from './PassageViewer';
import { ReadingGroupRenderer } from './ReadingGroupRenderer';
import { ExamTimer } from '@/components/shared/ExamTimer';
import { AnswerSheetPanel } from '@/components/shared/AnswerSheetPanel';
import { SubmitModal } from '@/components/shared/SubmitModal';
import { FontAwesome } from '@expo/vector-icons';
import { submitAnswers } from '@/lib/api/progress';

interface ReadingScreenProps {
  lesson: LessonDTO;
  groupedQuestions: GroupedQuestion[];
  timeLimitMinutes?: number;
}

export function ReadingScreen({ lesson, groupedQuestions, timeLimitMinutes = 60 }: ReadingScreenProps) {
  const router = useRouter();
  const {
    initLesson, setAnswer, setSubmitting, setCompleted,
    answers, groups, setCurrentGroup,
    isSubmitting, isCompleted, results, score,
    lessonId,
  } = useTestStore();

  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!lesson || !lesson.id) return;
    initLesson(lesson.id, lesson.title, lesson.passages || [], groupedQuestions, timeLimitMinutes);
  }, [lesson?.id]);

  useEffect(() => {
    if (!lessonId) return;
    setCurrentGroup(0);
  }, [lessonId]);

  const allQuestions = groups.flatMap((g) => g.questions);
  const totalQuestions = allQuestions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswer(questionId, answer);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !lessonId) return;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const answersPayload = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer,
      }));
      const res = await submitAnswers({ lesson_id: lessonId, answers: answersPayload });
      setCompleted(res.results || [], res.score || 0);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit answers.');
      setSubmitting(false);
    }
  }, [lessonId, answers, isSubmitting]);

  const handleTimeUp = useCallback(() => {
    Alert.alert('Time Up', 'Your time is up. Submitting your answers...');
    setShowSubmitModal(true);
  }, []);

  const handleJumpTo = useCallback((qNum: number) => {
    setShowAnswerSheet(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  if (!lesson || !lesson.id) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isCompleted && results) {
    const pct = totalQuestions > 0 ? Math.round((score || 0) / totalQuestions * 100) : 0;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
        <View style={styles.resultCard}>
          <FontAwesome name="check-circle" size={56} color={colors.tertiary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.resultTitle}>Test Complete</Text>
          <Text style={styles.resultScore}>
            {score} / {totalQuestions}
          </Text>
          <Text style={styles.resultPct}>{pct}%</Text>

          <View style={styles.resultBreakdown}>
            {results.map((r, i) => (
              <View key={r.question_id} style={styles.resultRow}>
                <Text style={styles.resultQNum}>Q{i + 1}</Text>
                <FontAwesome name={r.is_correct ? 'check' : 'times'} size={14} color={r.is_correct ? colors.success : colors.error} />
                <Text style={styles.resultAnswer}>Your: {r.answer || '-'}</Text>
                {!r.is_correct && r.correct_answer ? (
                  <Text style={styles.resultCorrect}>Correct: {r.correct_answer}</Text>
                ) : null}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title || 'Reading Test'}</Text>
        <ExamTimer onTimeUp={handleTimeUp} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {lesson.passages?.map((p) => (
          <PassageViewer key={p.id} title={p.title} contentHtml={p.content_html} />
        ))}

        {groups.map((g, gIdx) => (
          <View key={g.group.id}>
            <ReadingGroupRenderer
              group={g.group}
              questions={g.questions}
              answers={answers}
              onAnswer={handleAnswer}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.answerSheetBtn}
          onPress={() => setShowAnswerSheet(!showAnswerSheet)}
        >
          <FontAwesome name="th-large" size={16} color={colors.primary} />
          <Text style={styles.answerSheetText}>
            {answeredCount}/{totalQuestions}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => setShowSubmitModal(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {showAnswerSheet && (
        <View style={styles.answerSheetOverlay}>
          <AnswerSheetPanel onJumpTo={handleJumpTo} />
        </View>
      )}

      <SubmitModal
        visible={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  scrollArea: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  answerSheetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow,
  },
  answerSheetText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  submitBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, backgroundColor: colors.primary,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  answerSheetOverlay: {
    position: 'absolute', bottom: 64, left: spacing.md, right: spacing.md,
  },

  resultContent: { padding: spacing.lg, paddingBottom: spacing.xxl + 40 },
  resultCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', ...shadow.card },
  resultTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  resultScore: { fontSize: 36, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] },
  resultPct: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.lg },
  resultBreakdown: { width: '100%', gap: spacing.xs, marginBottom: spacing.lg },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.unit },
  resultQNum: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, width: 28 },
  resultAnswer: { fontSize: 13, color: colors.text, flex: 1 },
  resultCorrect: { fontSize: 12, color: colors.success, fontWeight: '600' },
  doneBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
