import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { LessonDTO } from '@/lib/api/types';
import { WritingEditor } from './WritingEditor';
import { Task1AcademicPrompt } from './Task1AcademicPrompt';
import { Task1GeneralPrompt } from './Task1GeneralPrompt';
import { Task2Prompt } from './Task2Prompt';
import { WritingFeedback } from '@/components/lesson/WritingFeedback';
import { ExamTimer } from '@/components/shared/ExamTimer';
import { FontAwesome } from '@expo/vector-icons';
import { submitAnswers } from '@/lib/api/progress';
import { useWritingStore } from '@/stores/useWritingStore';

interface WritingScreenProps {
  lesson: LessonDTO;
  timeLimitMinutes?: number;
}

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
  return [
    'Explain the situation',
    'Describe what you would like to happen',
    'Suggest a resolution or next step',
  ];
}

function detectTone(instruction: string): 'FORMAL' | 'SEMI_FORMAL' | 'INFORMAL' {
  const lower = instruction.toLowerCase();
  if (lower.includes('friend') || lower.includes('informal') || lower.includes('letter to a friend')) return 'INFORMAL';
  if (lower.includes('manager') || lower.includes('newspaper') || lower.includes('complain') || lower.includes('formal')) return 'FORMAL';
  return 'SEMI_FORMAL';
}

export function WritingScreen({ lesson, timeLimitMinutes = 60 }: WritingScreenProps) {
  const router = useRouter();
  const { clearDraft } = useWritingStore();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<any>(undefined);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const instruction = lesson.content || lesson.passages?.[0]?.content_html || '';
  const lessonId = lesson.id;
  const group = lesson.question_groups?.[0];
  const groupType = group?.group_type || 'WRITING_TASK2';
  const isTask1 = groupType === 'WRITING_TASK1';
  const isAcademic = !instruction.toLowerCase().includes('general training') && !instruction.toLowerCase().includes('letter');
  const essayType = isTask1 ? null : detectEssayType(instruction);
  const taskId = `${lessonId}_${groupType}`;

  useEffect(() => {
    setActiveTask(taskId);
  }, [taskId]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !lessonId || !activeTask) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);
    try {
      const text = useWritingStore.getState().drafts[taskId] || '';
      const answers = [{ question_id: taskId, answer: text }];
      const res = await submitAnswers({ lesson_id: lessonId, answers });
      setFeedback({
        overall_score: res.score ?? undefined,
        criteria_scores: res.results?.reduce((acc: any, r: any) => {
          if (r.question_id) acc[r.question_id] = r.score;
          return acc;
        }, {}),
        feedback: res.results?.[0]?.correct_answer ? `Score: ${res.score}. Key areas to improve: check grammar, vocabulary range, and task response.` : 'Submission received.',
        suggested_version: undefined,
      });
      setIsCompleted(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit.');
    } finally {
      setIsSubmitting(false);
    }
  }, [lessonId, activeTask, taskId, isSubmitting]);

  const handleTimeUp = useCallback(() => {
    Alert.alert('Time Up', 'Your time is up. Submitting...');
    handleSubmit();
  }, [handleSubmit]);

  if (!lesson) return null;

  if (isCompleted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
        <View style={styles.resultCard}>
          <FontAwesome name="check-circle" size={56} color={colors.tertiary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.resultTitle}>Writing Submitted</Text>
          <WritingFeedback feedback={feedback} />
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { clearDraft(taskId); router.back(); }}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const minWords = isTask1 ? (isAcademic ? 150 : 150) : 250;
  const recWords = isTask1 ? (isAcademic ? 170 : 170) : 280;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title || 'Writing Test'}</Text>
        <ExamTimer onTimeUp={handleTimeUp} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.previewBtn}
          onPress={() => {
            const text = useWritingStore.getState().drafts[taskId] || '';
            Alert.alert('Word Count', `Current: ${text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0} words\nMinimum: ${minWords} words\nRecommended: ${recWords}+ words`);
          }}
        >
          <FontAwesome name="info-circle" size={16} color={colors.primary} />
          <Text style={styles.previewBtnText}>Count</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => setShowSubmitModal(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
        </TouchableOpacity>
      </View>

      {/* Simple confirm modal */}
      {showSubmitModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FontAwesome name="check-circle" size={48} color={colors.tertiary} style={{ marginBottom: spacing.md }} />
            <Text style={styles.modalTitle}>Submit Writing?</Text>
            <Text style={styles.modalText}>Your essay will be sent for AI scoring. This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.cancelText}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  scrollContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md, flex: 1 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow,
  },
  previewBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  submitBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, backgroundColor: colors.primary,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg, width: '100%', maxWidth: 340, alignItems: 'center', ...shadow.card },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  modalText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  resultContent: { padding: spacing.lg, paddingBottom: spacing.xxl + 40 },
  resultCard: { ...shadow.card },
  resultTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  actionRow: { marginTop: spacing.lg },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
