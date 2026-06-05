import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useTestStore } from '@/stores/useTestStore';
import type { GroupedQuestion } from '@/stores/useTestStore';
import type { LessonDTO, PassageDTO, QuestionGroupDTO } from '@/lib/api/types';
import { PassageViewer } from './PassageViewer';
import { ReadingGroupRenderer } from './ReadingGroupRenderer';
import { ExamTimer } from '@/components/shared/ExamTimer';
import { AnswerSheetPanel } from '@/components/shared/AnswerSheetPanel';
import { SubmitModal } from '@/components/shared/SubmitModal';
import { ExamResultModal } from '@/components/shared/ExamResultModal';
import { ScoringQueuedScreen } from '@/components/shared/ScoringQueuedScreen';
import { DictionaryOverlay, useDictionaryOverlay } from '@/components/shared/DictionaryOverlay';
import { PartSectionHeader } from '@/components/shared/PartSectionHeader';
import { FontAwesome } from '@expo/vector-icons';
import { submitAnswers, saveDraft } from '@/lib/api/progress';

interface ReadingScreenProps {
  lesson: LessonDTO;
  groupedQuestions: GroupedQuestion[];
  timeLimitMinutes?: number;
}

export function ReadingScreen({ lesson, groupedQuestions, timeLimitMinutes = 60 }: ReadingScreenProps) {
  const router = useRouter();
  const showDict = useDictionaryOverlay((s) => s.show);
  const {
    initLesson, setAnswer, setSubmitting, setCompleted,
    answers, groups, setCurrentGroup,
    isSubmitting, isCompleted, results, score,
    lessonId, lessonTitle, resetForRetake,
  } = useTestStore();

  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferredInfo, setDeferredInfo] = useState<{ estimatedMinutes: number; message: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!lesson || !lesson.id) return;
    initLesson(lesson.id, lesson.title, lesson.passages || [], groupedQuestions, timeLimitMinutes);
    autoSubmittedRef.current = false;
  }, [lesson?.id]);

  useEffect(() => {
    if (!lessonId) return;
    setCurrentGroup(0);
  }, [lessonId]);

  // Hiện result modal khi hoàn thành
  useEffect(() => {
    if (isCompleted) setShowResultModal(true);
  }, [isCompleted]);

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

      // Free user → deferred (kết quả sau 2 phút)
      if ((res as any).scoring_mode === 'deferred') {
        setIsDeferred(true);
        setDeferredInfo({
          estimatedMinutes: (res as any).estimated_wait_minutes ?? 2,
          message: (res as any).message ?? 'Kết quả sẽ xuất hiện trong mục Lịch sử sau vài phút.',
        });
        setCompleted([], 0);
        return;
      }

      setCompleted(res.results || [], res.score || 0);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit answers.');
      setSubmitting(false);
    }
  }, [lessonId, answers, isSubmitting]);

  // Auto-submit khi hết giờ
  const handleTimeUp = useCallback(() => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    handleSubmit();
  }, [handleSubmit]);

  const handleJumpTo = useCallback((qNum: number) => {
    setShowAnswerSheet(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleRetake = useCallback(async () => {
    setShowResultModal(false);
    // Reset draft trên server
    if (lessonId) {
      try {
        await saveDraft({ lesson_id: lessonId, draft_answers: {}, time_left: timeLimitMinutes * 60 });
      } catch { /* ignore */ }
    }
    resetForRetake();
    autoSubmittedRef.current = false;
  }, [lessonId, timeLimitMinutes, resetForRetake]);

  // --- Mixed-part grouped rendering ---
  // Derives which parts to render from lesson.lesson_parts (e.g. [1,3]).
  // Falls back to rendering all content without part headers if lesson_parts is absent.
  const renderPartSections = useCallback(() => {
    const allPassages = lesson.passages ?? [];
    const allGroups = groups;
    const partsToRender = lesson.lesson_parts;

    // No explicit part config → render flat (backwards-compatible)
    if (!partsToRender || partsToRender.length === 0) {
      return (
        <>
          {allPassages.map((p) => (
            <PassageViewer key={p.id} title={p.title} contentHtml={p.content_html} />
          ))}
          {allGroups.map((g) => (
            <View key={g.group.id}>
              <ReadingGroupRenderer
                group={g.group}
                questions={g.questions}
                answers={answers}
                onAnswer={handleAnswer}
              />
            </View>
          ))}
        </>
      );
    }

    // Render each active part in order
    return partsToRender.map((partNum) => {
      const partPassages = allPassages.filter((p) => (p.part ?? 1) === partNum);
      const partGroups = allGroups.filter((g) => (g.group.part ?? 1) === partNum);
      // Use first passage title as part title if available
      const partTitle = partPassages[0]?.title ?? null;

      return (
        <View key={partNum}>
          <PartSectionHeader partNumber={partNum} title={partTitle} />
          {partPassages.map((p) => (
            <PassageViewer key={p.id} title={undefined} contentHtml={p.content_html} />
          ))}
          {partGroups.map((g) => (
            <View key={g.group.id}>
              <ReadingGroupRenderer
                group={g.group}
                questions={g.questions}
                answers={answers}
                onAnswer={handleAnswer}
              />
            </View>
          ))}
        </View>
      );
    });
  }, [lesson.passages, lesson.lesson_parts, groups, answers, handleAnswer]);

  if (!lesson || !lesson.id) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Free user: hiện màn hình thông báo deferred
  if (isCompleted && isDeferred && deferredInfo) {
    return (
      <ScoringQueuedScreen
        lessonTitle={lessonTitle || lesson.title}
        estimatedMinutes={deferredInfo.estimatedMinutes}
        message={deferredInfo.message}
        onGoHome={() => router.replace('/(tabs)')}
        onGoHistory={() => router.replace('/(tabs)/test')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title || 'Reading Test'}</Text>
        <TouchableOpacity
          style={styles.dictBtn}
          onPress={() => showDict('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="search" size={16} color={colors.primary} />
        </TouchableOpacity>
        <ExamTimer onTimeUp={handleTimeUp} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderPartSections()}
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

      <ExamResultModal
        visible={showResultModal}
        lessonTitle={lessonTitle || lesson.title}
        lessonType="reading"
        score={score ?? 0}
        totalQuestions={totalQuestions}
        results={results ?? []}
        onDone={() => { setShowResultModal(false); router.back(); }}
      />

      {/* Dictionary overlay — tra từ nhanh trong bài đọc */}
      <DictionaryOverlay />
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
  dictBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.md,
  },
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
});
