import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useState, useCallback } from 'react';
import { Screen } from '@/components/ui/Screen';
import { LiveSpeakingWidget } from '@/components/speaking/LiveSpeakingWidget';
import { ScoringQueuedScreen } from '@/components/shared/ScoringQueuedScreen';
import { colors, spacing } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { endSession as apiEndSession } from '@/lib/api/speaking';

export default function SpeakingSessionScreen() {
  const router = useRouter();
  const { sessionId, setReport, turns } = useSpeakingStore();
  const endCalledRef = useRef(false);

  const [isDeferred, setIsDeferred] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [deferredInfo, setDeferredInfo] = useState<{
    estimatedMinutes: number;
    message: string;
    lessonTitle: string;
  } | null>(null);

  // Logic chung cho cả timer-end và manual-end
  const _doEndSession = useCallback(async () => {
    if (!sessionId) {
      router.replace('/speaking/select');
      return;
    }

    setIsEnding(true);
    try {
      const res = await apiEndSession(sessionId);

      if ((res as any).scoring_mode === 'deferred') {
        setIsDeferred(true);
        setDeferredInfo({
          estimatedMinutes: (res as any).estimated_wait_minutes ?? 5,
          message: (res as any).message ?? 'Báo cáo sẽ xuất hiện trong mục Lịch sử sau ~5 phút.',
          lessonTitle: 'Speaking Session',
        });
        return;
      }

      setReport(res.report ?? null);
      router.replace('/speaking/report');
    } catch {
      // API failed — build a local report from stored turns so user still sees something
      const avgBand = turns.length > 0
        ? turns.reduce((s, t) => s + (t.band_estimate || 0), 0) / turns.length
        : 0;
      setReport({
        sessionId,
        persona: 'james',
        duration: 0,
        turnsCompleted: turns.length,
        averageBandEstimate: parseFloat(avgBand.toFixed(1)),
        breakdown: {
          fluency: avgBand,
          lexicalResource: avgBand,
          grammaticalRange: avgBand,
          pronunciation: avgBand,
        },
        topErrors: [],
        nextSessionSuggestion: 'Không thể lấy nhận xét chi tiết. Hãy thử lại lần sau.',
      });
      router.replace('/speaking/report');
    } finally {
      setIsEnding(false);
    }
  }, [sessionId, turns, router, setReport]);

  /**
   * Kết thúc session khi hết giờ (timer fire).
   * Guard bằng ref để tránh gọi 2 lần nếu timer fire nhiều lần.
   */
  const handleEndSession = useCallback(async () => {
    if (endCalledRef.current) return;
    endCalledRef.current = true;
    await _doEndSession();
  }, [_doEndSession]);

  /**
   * Kết thúc session khi user bấm nút End.
   * Set guard để tránh timer fire thêm sau khi đã end.
   */
  const handleManualEnd = useCallback(async () => {
    endCalledRef.current = true;
    await _doEndSession();
  }, [_doEndSession]);

  /**
   * Thoát giữa chừng (nút back/chevron).
   * Reset store hoàn toàn — không gọi API end session.
   */
  const handleExit = useCallback(() => {
    useSpeakingStore.getState().resetStore();
    router.back();
  }, [router]);

  if (!sessionId) return null;

  // Đang gọi API end — hiện overlay loading để user biết đang xử lý
  if (isEnding) {
    return (
      <Screen safe>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tổng hợp kết quả...</Text>
        </View>
      </Screen>
    );
  }

  // Free user: hiện màn hình thông báo deferred
  if (isDeferred && deferredInfo) {
    return (
      <ScoringQueuedScreen
        lessonTitle={deferredInfo.lessonTitle}
        estimatedMinutes={deferredInfo.estimatedMinutes}
        message={deferredInfo.message}
        onGoHome={() => { useSpeakingStore.getState().resetStore(); router.replace('/(tabs)'); }}
        onGoHistory={() => { useSpeakingStore.getState().resetStore(); router.replace('/(tabs)/test'); }}
      />
    );
  }

  return (
    <Screen safe>
      <View style={styles.container}>
        <LiveSpeakingWidget
          mode="practice"
          onEndSession={handleEndSession}
          onManualEnd={handleManualEnd}
          onExit={handleExit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
