import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { LessonDTO } from '@/lib/api/types';
import { Task1GeneralPrompt } from './Task1GeneralPrompt';
import { Task1AcademicPrompt } from './Task1AcademicPrompt';
import { Task2Prompt } from './Task2Prompt';
import { WritingEditor } from './WritingEditor';
import { WordCountBar } from './WordCountBar';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useWritingStore } from '@/stores/useWritingStore';
import { useTestStore } from '@/stores/useTestStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { submitAnswers } from '@/lib/api/progress';
import { ExamResultModal, type WritingAIFeedback } from '@/components/shared/ExamResultModal';
import { ScoringQueuedScreen } from '@/components/shared/ScoringQueuedScreen';
import { FontAwesome } from '@expo/vector-icons';

interface WritingScreenProps {
  lesson: LessonDTO;
  timeLimitMinutes?: number;
}

export function WritingScreen({ lesson, timeLimitMinutes = 60 }: WritingScreenProps) {
  const router = useRouter();
  const lessonId = lesson.id;
  const { drafts, autoSave, clearDraft, lastSavedAt } = useWritingStore();
  const { setCompleted, rewardCoins } = useTestStore();
  const { refreshUser } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState<WritingAIFeedback | null>(null);

  const [isDeferred, setIsDeferred] = useState(false);
  const [deferredInfo, setDeferredInfo] = useState<{ estimatedMinutes: number; message: string } | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);

  const taskId = lesson.questions?.[0]?.id || 'default-task';
  const taskType = lesson.passages?.[0]?.task_type || 'report';
  const isTask2 = taskId.includes('task2') || lesson.title.toUpperCase().includes('TASK 2');

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
      const feedback = mapToWritingFeedback(res);
      setWritingFeedback(feedback);
      setCompleted(res.results || [], res.score || 0, feedback, (res as any).coins_awarded);
      setIsCompleted(true);
      refreshUser();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [lessonId, taskId, isSubmitting]);

  const mapToWritingFeedback = (apiRes: any): WritingAIFeedback => {
    const mainResult = apiRes.results?.[0]?.feedback;
    return {
      overall_score: mainResult?.overall_score ?? apiRes.score ?? 0,
      criteria_scores: mainResult?.criteria_scores || {},
      feedback: mainResult?.feedback || '',
      detailed_errors: mainResult?.detailed_errors || [],
      suggested_version: mainResult?.suggested_version || '',
    };
  };

  if (isCompleted && isDeferred && deferredInfo) {
    return (
      <ScoringQueuedScreen
        lessonTitle={lesson.title}
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
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
        <AutoSaveIndicator lastSavedAt={lastSavedAt[taskId] || null} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isTask2 ? (
          <Task2Prompt 
            instruction={lesson.passages?.[0]?.content_html || ''} 
            essayType={lesson.passages?.[0]?.essay_type || 'DISCUSSION'} 
          />
        ) : (
          taskType === 'report' ? (
            <Task1AcademicPrompt
              instruction={lesson.passages?.[0]?.content_html || ''}
              imageUrl={lesson.passages?.[0]?.image_url || undefined}
              visualType={lesson.passages?.[0]?.visual_type || 'BAR_CHART'}
            />
          ) : (
            <Task1GeneralPrompt 
              instruction={lesson.passages?.[0]?.content_html || ''} 
              bulletPoints={lesson.passages?.[0]?.bullet_points || []}
              toneRequired={(lesson.passages?.[0]?.essay_type as any) || 'SEMI_FORMAL'}
            />
          )
        )}

        <WritingEditor
          taskId={taskId}
          lessonId={lessonId}
          minWords={isTask2 ? 250 : 150}
          placeholder="Nhập nội dung bài viết tại đây..."
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <WordCountBar 
          current={drafts[taskId]?.split(/\s+/).filter(Boolean).length || 0} 
          min={isTask2 ? 250 : 150} 
        />
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => setShowSubmitModal(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận nộp bài?</Text>
            <Text style={styles.modalSub}>Bạn không thể chỉnh sửa sau khi đã nộp.</Text>
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

      <ExamResultModal
        visible={showResultModal}
        lessonTitle={lesson.title}
        lessonType="writing"
        score={writingFeedback?.overall_score ?? 0}
        totalQuestions={1}
        results={[]}
        writingFeedback={writingFeedback || undefined}
        rewardCoins={rewardCoins}
        onDone={() => { setShowResultModal(false); clearDraft(taskId); router.back(); }}
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
  scrollContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  bottomBar: {
    padding: spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  submitBtn: {
    width: '100%', alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: radius.lg, backgroundColor: colors.primary, marginTop: spacing.sm,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.primary },
  confirmText: { fontWeight: '700', color: '#fff' },
});
