import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Screen } from '@/components/ui/Screen';
import { LiveSpeakingWidget } from '@/components/speaking/LiveSpeakingWidget';
import { colors } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { endSession as apiEndSession } from '@/lib/api/speaking';

export default function SpeakingSessionScreen() {
  const router = useRouter();
  const { sessionId, setReport, setAppState, turns, prefilledTopic } = useSpeakingStore();
  const endCalledRef = useRef(false);

  const handleEndSession = async () => {
    if (endCalledRef.current) return;
    endCalledRef.current = true;

    if (!sessionId) {
      router.replace('/speaking/select');
      return;
    }

    try {
      const res = await apiEndSession(sessionId);
      setReport(res.report);
    } catch {
      // API failed — build a fallback report from local turns data
      const avgBand = turns.length > 0
        ? turns.reduce((s, t) => s + (t.band_estimate || 0), 0) / turns.length
        : 0;
      setReport({
        sessionId,
        persona: 'james',
        duration: 0,
        turnsCompleted: turns.length,
        averageBandEstimate: parseFloat(avgBand.toFixed(1)),
        breakdown: { fluency: avgBand, lexicalResource: avgBand, grammaticalRange: avgBand, pronunciation: avgBand },
        topErrors: [],
        nextSessionSuggestion: 'Không thể lấy nhận xét chi tiết. Hãy thử lại lần sau.',
      });
    } finally {
      router.replace('/speaking/report');
    }
  };


  if (!sessionId) return null;

  return (
    <Screen safe>
      <View style={styles.container}>
        <LiveSpeakingWidget
          mode="practice"
          onEndSession={handleEndSession}
          onManualEnd={handleEndSession}
          onExit={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
