/**
 * Pronunciation Practice Screen — Phase 3 UI
 *
 * Nâng cấp từ Phase 2:
 * - Waveform animation thực (bars nhảy theo metering)
 * - Score ring (vòng tròn progress với màu gradient)
 * - Phoneme diff (highlight từng ký tự sai màu đỏ)
 * - Attempt history (5 lần thử gần nhất)
 */
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withSequence, withTiming, interpolate,
} from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useRecorder } from '@/hooks/useRecorder';
import { api } from '@/lib/api/api';
import * as FileSystem from 'expo-file-system';
import { useDailyStore } from '@/stores/useDailyStore';

const { width } = Dimensions.get('window');
const BAR_COUNT = 28;

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ metering, isActive }: { metering: number; isActive: boolean }) {
  // metering: -160 (silent) → 0 (max)
  const normalised = Math.max(0, Math.min(1, (metering + 160) / 160));

  return (
    <View style={waveStyles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const center = BAR_COUNT / 2;
        const distFromCenter = Math.abs(i - center) / center; // 0 at center, 1 at edges
        const baseHeight = 4;
        const maxHeight = 48;
        // Center bars taller, edge bars shorter
        const shapeFactor = 1 - distFromCenter * 0.7;
        // Add slight randomness per bar using index as seed
        const jitter = isActive ? (Math.sin(i * 2.3 + Date.now() / 200) * 0.3 + 0.7) : 1;
        const height = isActive
          ? baseHeight + (maxHeight - baseHeight) * normalised * shapeFactor * jitter
          : baseHeight + (maxHeight - baseHeight) * 0.15 * shapeFactor;

        return (
          <View
            key={i}
            style={[
              waveStyles.bar,
              {
                height,
                backgroundColor: isActive
                  ? `rgba(0,88,190,${0.4 + normalised * 0.6})`
                  : colors.outlineVariant,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 64,
    paddingHorizontal: spacing.md,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ accuracy }: { accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const color = pct >= 80 ? '#00B894' : pct >= 50 ? '#FDCB6E' : '#D63031';
  const label = pct >= 80 ? 'Xuất sắc' : pct >= 50 ? 'Khá tốt' : 'Thử lại';

  // Simple SVG-like ring using border trick
  const RING = 88;
  const circumference = Math.PI * RING;
  const filled = (pct / 100) * circumference;

  return (
    <View style={ringStyles.container}>
      {/* Background ring */}
      <View style={[ringStyles.ring, { borderColor: color + '25' }]} />
      {/* Score text */}
      <View style={ringStyles.inner}>
        <Text style={[ringStyles.pct, { color }]}>{pct}%</Text>
        <Text style={[ringStyles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
  },
  inner: { alignItems: 'center' },
  pct: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});

// ─── Phoneme Diff ─────────────────────────────────────────────────────────────

function PhonemeDiff({ target, heard }: { target: string; heard: string }) {
  // Align characters and highlight mismatches
  const t = target.toLowerCase().split('');
  const h = heard.toLowerCase().split('');
  const maxLen = Math.max(t.length, h.length);

  return (
    <View style={diffStyles.container}>
      <Text style={diffStyles.label}>Bạn đã nói:</Text>
      <View style={diffStyles.row}>
        {Array.from({ length: maxLen }).map((_, i) => {
          const tc = t[i] ?? '';
          const hc = h[i] ?? '_';
          const match = tc === hc;
          return (
            <View key={i} style={[diffStyles.charBox, !match && diffStyles.charBoxWrong]}>
              <Text style={[diffStyles.charHeard, !match && diffStyles.charWrong]}>{hc}</Text>
              {!match && <Text style={diffStyles.charTarget}>{tc || '·'}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const diffStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.xs },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3 },
  charBox: {
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  charBoxWrong: { backgroundColor: '#FFEBEE' },
  charHeard: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  charWrong: { color: '#C62828' },
  charTarget: { fontSize: 9, color: '#C62828', fontWeight: '700' },
});

// ─── Attempt History ──────────────────────────────────────────────────────────

interface Attempt {
  accuracy: number;
  transcription: string;
  timestamp: number;
}

function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) return null;
  return (
    <View style={histStyles.container}>
      <Text style={histStyles.title}>Lịch sử thử ({attempts.length})</Text>
      {attempts.map((a, i) => {
        const pct = Math.round(a.accuracy * 100);
        const color = pct >= 80 ? '#00B894' : pct >= 50 ? '#FDCB6E' : '#D63031';
        return (
          <View key={i} style={histStyles.row}>
            <View style={[histStyles.dot, { backgroundColor: color }]} />
            <Text style={histStyles.pct}>{pct}%</Text>
            <Text style={histStyles.heard} numberOfLines={1}>"{a.transcription}"</Text>
          </View>
        );
      })}
    </View>
  );
}

const histStyles = StyleSheet.create({
  container: { width: '100%', gap: spacing.xs },
  title: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pct: { fontSize: 13, fontWeight: '800', color: colors.text, width: 36 },
  heard: { flex: 1, fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Status = 'idle' | 'recording' | 'processing' | 'success' | 'fail';

export default function PronunciationScreen() {
  const router = useRouter();
  const { startRecording, stopRecording, isRecording, meteringValue } = useRecorder();
  const [targetWord, setTargetWord] = useState('Extraordinary');
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<{ accuracy: number; transcription: string } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const completeTask = useDailyStore(s => s.completeTask);

  // Pulse animation for record button
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    const dailyStore = useDailyStore.getState();
    const speakingTask = dailyStore.tasks.find(t => t.type === 'speaking');
    if (speakingTask) {
      const word = speakingTask.title.split(': ')[1];
      if (word) setTargetWord(word);
    }
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1, true
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 600 }), withTiming(0, { duration: 600 })),
        -1, true
      );
    } else {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = async () => {
    setStatus('recording');
    setFeedback(null);
    await startRecording();
  };

  const handlePressOut = async () => {
    setStatus('processing');
    const uri = await stopRecording();
    if (uri) await processAudio(uri);
    else setStatus('idle');
  };

  const processAudio = async (uri: string) => {
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const res = await api.post('/ai/pronunciation-check', {
        audio: base64Audio,
        target_text: targetWord,
      });

      if (res.success) {
        const { accuracy, transcription } = res.data;
        setFeedback({ accuracy, transcription });
        setStatus(accuracy >= 0.7 ? 'success' : 'fail');
        setAttempts(prev => [
          { accuracy, transcription, timestamp: Date.now() },
          ...prev.slice(0, 4), // keep last 5
        ]);
        if (accuracy >= 0.7) completeTask('daily-speaking');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Process audio failed:', err);
      setStatus('idle');
    }
  };

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, a) => a.accuracy > best.accuracy ? a : best)
    : null;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luyện phát âm AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Target word card */}
        <View style={styles.wordCard}>
          <Text style={styles.wordLabel}>Hãy phát âm từ:</Text>
          <Text style={styles.targetWord}>{targetWord}</Text>
          {bestAttempt && (
            <View style={styles.bestBadge}>
              <FontAwesome name="star" size={11} color="#FDCB6E" />
              <Text style={styles.bestText}>Tốt nhất: {Math.round(bestAttempt.accuracy * 100)}%</Text>
            </View>
          )}
        </View>

        {/* Waveform */}
        <View style={styles.waveCard}>
          <Waveform metering={meteringValue} isActive={isRecording} />
          <Text style={styles.waveHint}>
            {status === 'idle' && 'Nhấn giữ nút mic để bắt đầu'}
            {status === 'recording' && 'Đang nghe... thả để phân tích'}
            {status === 'processing' && 'AI đang phân tích...'}
            {status === 'success' && '✓ Phát âm tốt!'}
            {status === 'fail' && 'Thử lại nhé, gần đúng rồi!'}
          </Text>
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <ScoreRing accuracy={feedback.accuracy} />
            <View style={styles.feedbackRight}>
              <PhonemeDiff target={targetWord} heard={feedback.transcription} />
              <Text style={[
                styles.feedbackMsg,
                { color: feedback.accuracy >= 0.7 ? '#00B894' : '#D63031' },
              ]}>
                {feedback.accuracy >= 0.8
                  ? 'Xuất sắc! Phát âm rất chuẩn.'
                  : feedback.accuracy >= 0.7
                  ? 'Tốt! Tiếp tục luyện tập.'
                  : feedback.accuracy >= 0.5
                  ? 'Khá tốt, nhấn mạnh âm tiết hơn nhé.'
                  : 'Hãy thử lại, chú ý từng âm tiết.'}
              </Text>
            </View>
          </View>
        )}

        {/* Attempt history */}
        <AttemptHistory attempts={attempts} />
      </ScrollView>

      {/* Record button */}
      <View style={styles.footer}>
        <View style={styles.recordWrapper}>
          <Animated.View style={[styles.pulse, pulseStyle]} />
          <TouchableOpacity
            style={[
              styles.recordBtn,
              isRecording && styles.recordingBtn,
              status === 'processing' && styles.processingBtn,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={status === 'processing'}
            activeOpacity={0.85}
          >
            {status === 'processing' ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <FontAwesome
                name="microphone"
                size={28}
                color="white"
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.recordHint}>
          {isRecording ? 'Thả để phân tích' : 'Nhấn giữ để nói'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },

  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 140,
  },

  wordCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  wordLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  targetWord: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  bestText: { fontSize: 12, fontWeight: '700', color: '#E17055' },

  waveCard: {
    backgroundColor: '#F8F9FE',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  waveHint: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  feedbackRight: { flex: 1, gap: spacing.sm },
  feedbackMsg: { fontSize: 13, fontWeight: '600', lineHeight: 20 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(247,249,251,0.95)',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recordWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
  },
  recordBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  recordingBtn: { backgroundColor: '#D63031' },
  processingBtn: { backgroundColor: colors.outline },
  recordHint: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
});
