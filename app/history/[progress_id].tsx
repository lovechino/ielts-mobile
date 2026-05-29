import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ExamResultModal } from '@/components/shared/ExamResultModal';
import { colors, spacing } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { fetchProgress } from '@/lib/api/progress';
import { fetchSpeakingSession } from '@/lib/api/speaking';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import type { WritingAIFeedback } from '@/components/shared/ExamResultModal';

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { progress_id, lesson_id, lesson_type, lesson_title, needs_unlock } = useLocalSearchParams<{
    progress_id: string;
    lesson_id: string;
    lesson_type?: string;
    lesson_title?: string;
    needs_unlock?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [writingFeedback, setWritingFeedback] = useState<WritingAIFeedback | undefined>();

  const isWriting = (lesson_type || '').toLowerCase() === 'writing';
  const isSpeaking = (lesson_type || '').toLowerCase() === 'speaking';
  const isLocked = needs_unlock === '1';

  // Guard: if result is locked, redirect back immediately
  useEffect(() => {
    if (isLocked) {
      router.back();
    }
  }, [isLocked]);

  useEffect(() => {
    if (isSpeaking) {
      fetchSpeakingSession(progress_id!)
        .then((data) => {
          if (!data || !data.report) {
            setError('Báo cáo speaking chưa sẵn sàng hoặc không tìm thấy.');
            return;
          }
          // Update store and navigate to report
          const { setReport } = useSpeakingStore.getState();
          setReport(data.report);
          router.replace('/speaking/report');
        })
        .catch((err) => {
          setError(err?.message || 'Không thể tải báo cáo speaking.');
        })
        .finally(() => setLoading(false));
      return;
    }

    if (!lesson_id) {
      setError('Không tìm thấy bài học.');
      setLoading(false);
      return;
    }

    fetchProgress(lesson_id)
      .then((progress) => {
        if (!progress) {
          setError('Không tìm thấy kết quả.');
          return;
        }

        setScore(progress.score ?? 0);
        setTotalQuestions(progress.results?.length ?? 0);
        setResults(progress.results ?? []);

        // Map writing feedback từ results
        if (isWriting && progress.results?.[0]?.feedback) {
          const fb = progress.results[0].feedback;
          setWritingFeedback({
            overall_score: fb.overall_score ?? progress.score ?? 0,
            criteria_scores: fb.criteria_scores,
            feedback: fb.feedback,
            suggested_version: fb.suggested_version,
          });
        }

        setShowModal(true);
      })
      .catch((err: any) => {
        setError(err?.message || 'Không thể tải kết quả.');
      })
      .finally(() => setLoading(false));
  }, [lesson_id, progress_id, isSpeaking]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải kết quả...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.center}>
          <FontAwesome name="exclamation-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>

      <ExamResultModal
        visible={showModal}
        lessonTitle={lesson_title || 'Kết quả bài kiểm tra'}
        lessonType={isWriting ? 'writing' : (lesson_type || 'reading') as any}
        score={score}
        totalQuestions={totalQuestions}
        results={results}
        writingFeedback={isWriting ? writingFeedback : undefined}
        onDone={() => { setShowModal(false); router.back(); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  loadingText: { fontSize: 15, color: colors.textSecondary },
  errorText: { fontSize: 15, color: colors.error, textAlign: 'center' },
  backBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 8 },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
