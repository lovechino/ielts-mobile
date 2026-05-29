import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StyleSheet, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { LessonDTO } from '@/lib/api/types';
import { WritingEditor } from './WritingEditor';
import { Task1AcademicPrompt } from './Task1AcademicPrompt';
import { Task1GeneralPrompt } from './Task1GeneralPrompt';
import { Task2Prompt } from './Task2Prompt';
import { ExamTimer } from '@/components/shared/ExamTimer';
import { ExamResultModal, type WritingAIFeedback } from '@/components/shared/ExamResultModal';
import { ScoringQueuedScreen } from '../shared/ScoringQueuedScreen';
import { FontAwesome } from '@expo/vector-icons';
import { submitAnswers, saveDraft } from '@/lib/api/progress';
import { useWritingStore } from '@/stores/useWritingStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectEssayType(instruction: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes('discuss') || lower.includes('both views') || lower.includes('advantages and disadvantages')) return 'DISCUSSION';
  if (lower.includes('problem') || lower.includes('solution') || lower.includes('cause') || lower.includes('measure')) return 'PROBLEM_SOLUTION';
  if (lower.includes('opinion') || lower.includes('agree') || lower.includes('disagree') || lower.includes('to what extent')) return 'OPINION';
  if (lower.includes('two') || lower.includes('second question')) return 'TWO_PART';
  return 'DIRECT_QUESTION';
}

function extractBulletPoints(instruction: string): string[] {
  const lines = instruction.split('\n').filter((l) => l.trim().startsWith('•') || l.trim().startsWith('-'));
  if (lines.length > 0) return lines.map((l) => l.replace(/^[•\-]\s*/, '').trim());
  const parenMatch = instruction.match(/\(([^)]+)\)/g);
  if (parenMatch && parenMatch.length >= 2) return parenMatch.map((p) => p.replace(/[()]/g, ''));
  return ['Explain the situation', 'Describe what you would like to happen', 'Suggest a resolution or next step'];
}

function detectTone(instruction: string): 'FORMAL' | 'SEMI_FORMAL' | 'INFORMAL' {
  const lower = instruction.toLowerCase();
  if (lower.includes('friend') || lower.includes('informal') || lower.includes('letter to a friend')) return 'INFORMAL';
  if (lower.includes('manager') || lower.includes('newspaper') || lower.includes('complain') || lower.includes('formal')) return 'FORMAL';
  return 'SEMI_FORMAL';
}

/**
 * Map ProgressDTO response → WritingAIFeedback shape.
 * Backend trả về feedback object trong results[0].feedback (JSON),
 * hoặc score tổng trong res.score.
 */
function mapToWritingFeedback(res: any): WritingAIFeedback {
  // Trường hợp backend trả về feedback object đầy đủ trong results[0]
  const firstResult = res.results?.[0];
  const rawFeedback = firstResult?.feedback;

  if (rawFeedback && typeof rawFeedback === 'object') {
    return {
      overall_score: rawFeedback.overall_score ?? res.score ?? 0,
      criteria_scores: rawFeedback.criteria_scores ?? undefined,
      feedback: rawFeedback.feedback ?? undefined,
      suggested_version: rawFeedback.suggested_version ?? undefined,
      // New fields from expert scorer
      word_count: rawFeedback.word_count ?? undefined,
      detailed_errors: rawFeedback.detailed_errors ?? undefined,
      sample_rewrite_segments: rawFeedback.sample_rewrite_segments ?? undefined,
    };
  }

  // Fallback: chỉ có score tổng
  return {
    overall_score: res.score ?? 0,
    criteria_scores: undefined,
    feedback: firstResult?.correct_answer || undefined,
    suggested_version: undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WritingScreenProps {
  lesson: LessonDTO;
  timeLimitMinutes?: number;
}

export function WritingScreen({ lesson, timeLimitMinutes = 60 }: WritingScreenProps) {
  const router = useRouter();
  const { clearDraft } = useWritingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDeferred, setIsDeferred] = useState(false); // free user → deferred
  const [deferredInfo, setDeferredInfo] = useState<{ estimatedMinutes: number; message: string } | null>(null);
  const [writingFeedback, setWritingFeedback] = useState<WritingAIFeedback | undefined>();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const autoSubmittedRef = useRef(false);

  const instruction = lesson.content || lesson.passages?.[0]?.content_html || '';
  const lessonId = lesson.id;
  const group = lesson.question_groups?.[0];
  const groupType = group?.group_type || 'WRITING_TASK2';
  const isTask1 = groupType === 'WRITING_TASK1';
  const isAcademic = !instruction.toLowerCase().includes('general training') && !instruction.toLowerCase().includes('letter');
  const essayType = isTask1 ? null : detectEssayType(instruction);
  const taskId = `${lessonId}_${groupType}`;
  const minWords = isTask1 ? 150 : 250;
  const recWords = isTask1 ? 170 : 280;

  // Hiện result modal khi hoàn thành
  useEffect(() => {
    if (isCompleted) setShowResultModal(true);
  }, [isCompleted]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !lessonId) return;

    const text = useWritingStore.getState().drafts[taskId] || '';
    if (!text.trim()) {
      Alert.alert('Chưa có nội dung', 'Vui lòng viết bài trước khi nộp.');
      return;
    }

    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const res = await submitAnswers({
        lesson_id: lessonId,
        answers: [{ question_id: taskId, answer: text }],
      });

      // Free user → deferred scoring
      if ((res as any).scoring_mode === 'deferred') {
        setIsDeferred(true);
        setDeferredInfo({
          estimatedMinutes: (res as any).estimated_wait_minutes ?? 7,
          message: (res as any).message ?? 'Kết quả sẽ xuất hiện trong mục Lịch sử sau vài phút.',
        });
        setIsCompleted(true);
        return;
      }

      // Premium → immediate result
      setWritingFeedback(mapToWritingFeedback(res));
      setIsCompleted(true);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [lessonId, taskId, isSubmitting]);

  // Auto-submit khi hết giờ — không hỏi lại
  const handleTimeUp = useCallback(() => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    handleSubmit();
  }, [handleSubmit]);

  const handleRetake = useCallback(async () => {
    setShowResultModal(false);
    clearDraft(taskId);
    if (lessonId) {
      try {
        await saveDraft({ lesson_id: lessonId, draft_answers: {}, time_left: timeLimitMinutes * 60 });
      } catch { /* ignore */ }
    }
    setIsCompleted(false);
    setWritingFeedback(undefined);
    autoSubmittedRef.current = false;
  }, [lessonId, taskId, timeLimitMinutes, clearDraft]);

  if (!lesson) return null;

  // Free user: hiện màn hình thông báo "kết quả sẽ có sau"
  if (isCompleted && isDeferred && deferredInfo) {
    return (
      <ScoringQueuedScreen
        lessonTitle={lesson.title}
        estimatedMinutes={deferredInfo.estimatedMinutes}
        message={deferredInfo.message}
        onGoHome={() => { clearDraft(taskId); router.replace('/(tabs)'); }}
        onGoHistory={() => { clearDraft(taskId); router.replace('/(tabs)/test'); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title || 'Writing Test'}</Text>
        {!isCompleted && <ExamTimer onTimeUp={handleTimeUp} />}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isTask1 && isAcademic && (
          <Task1AcademicPrompt
            visualType={group?.config?.visual_type || 'NONE'}
            imageUrl={group?.config?.image_url || lesson.passages?.[0]?.content_html?.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|gif)/i)?.[0]}
            instruction={instruction}
          />
        )}
        {isTask1 && !isAcademic && (
          <Task1GeneralPrompt
            instruction={instruction}
            bulletPoints={extractBulletPoints(instruction)}
            toneRequired={detectTone(instruction)}
          />
        )}
        {!isTask1 && (
          <Task2Prompt
            instruction={instruction}
            essayType={essayType || 'DISCUSSION'}
          />
        )}

        <WritingEditor
          taskId={taskId}
          lessonId={lessonId}
          minWords={minWords}
          recommendedWords={recWords}
          placeholder={`Write your ${isTask1 ? 'Task 1' : 'Task 2'} essay here...`}
          editable={!isCompleted}
        />

        {/* Submitting overlay hint */}
        {isSubmitting && (
          <View style={styles.scoringBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.scoringText}>AI đang chấm điểm bài viết của bạn...</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar — ẩn khi đã nộp */}
      {!isCompleted && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.countBtn}
            onPress={() => {
              const text = useWritingStore.getState().drafts[taskId] || '';
              const wc = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
              Alert.alert('Word Count', `Hiện tại: ${wc} từ\nTối thiểu: ${minWords} từ\nKhuyến nghị: ${recWords}+ từ`);
            }}
          >
            <FontAwesome name="info-circle" size={16} color={colors.primary} />
            <Text style={styles.countBtnText}>Đếm từ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.submitText}>Nộp bài</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Submit confirm modal */}
      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FontAwesome name="pencil-square" size={44} color={colors.primary} style={{ marginBottom: spacing.md }} />
            <Text style={styles.modalTitle}>Nộp bài Writing?</Text>
            <Text style={styles.modalText}>
              Bài viết sẽ được AI chấm điểm theo tiêu chí IELTS. Không thể chỉnh sửa sau khi nộp.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.cancelText}>Xem lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit}>
                <Text style={styles.confirmText}>Nộp bài</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result modal */}
      <ExamResultModal
        visible={showResultModal}
        lessonTitle={lesson.title}
        lessonType="writing"
        score={writingFeedback?.overall_score ?? 0}
        totalQuestions={1}
        results={[]}
        writingFeedback={writingFeedback}
        onDone={() => { setShowResultModal(false); clearDraft(taskId); router.back(); }}
        onRetake={handleRetake}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  scrollContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  scoringBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryFixed, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.sm,
  },
  scoringText: { fontSize: 14, color: colors.primary, fontWeight: '600', flex: 1 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  countBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow,
  },
  countBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  submitBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, backgroundColor: colors.primary,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    width: '100%', maxWidth: 340, alignItems: 'center', ...shadow.card,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  modalText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  confirmBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
