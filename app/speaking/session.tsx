import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Screen } from '@/components/ui/Screen';
import { LiveSpeakingWidget } from '@/components/speaking/LiveSpeakingWidget';
import { colors } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { endSession as apiEndSession } from '@/lib/api/speaking';

export default function SpeakingSessionScreen() {
  const router = useRouter();
  const { sessionId, setReport, setAppState } = useSpeakingStore();
  const endCalledRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/speaking/select');
    }
  }, [sessionId]);

  const handleEndSession = async () => {
    if (endCalledRef.current || !sessionId) return;
    endCalledRef.current = true;
    try {
      const res = await apiEndSession(sessionId);
      setReport(res.report);
      router.replace('/speaking/report');
    } catch (err: any) {
      Alert.alert('Error', 'Could not end session.');
      endCalledRef.current = false;
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
