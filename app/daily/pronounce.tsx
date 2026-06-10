/**
 * Daily Quest — Pronunciation Challenge
 *
 * Màn hình riêng cho nhiệm vụ phát âm daily quest.
 * - Từ cố định lấy từ daily challenge (không random)
 * - Không có nút "Từ khác"
 * - Có badge "Daily Quest" và nút hoàn thành
 */
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useRecorder } from '@/hooks/useRecorder';
import { api } from '@/lib/api/api';
import * as FileSystem from 'expo-file-system';
import { useDailyStore } from '@/stores/useDailyStore';
import { useTTS } from '@/hooks/useTTS';

const BAR_COUNT = 28;

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ metering, isActive }: { metering: number; isActive: boolean }) {
  const normalised = Math.max(0, Math.min(1, (metering + 160) / 160));
  return (
    <View style={waveStyles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const center = BAR_COUNT / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const shapeFactor = 1 - distFromCenter * 0.7;
        const jitter = isActive ? (Math.sin(i * 2.3 + Date.now() / 200) * 0.3 + 0.7) : 1;
        const height = isActive
          ? 4 + 44 * normalised * shapeFactor * jitter
          : 4 + 44 * 0.15 * shapeFactor;
        return (
          <View
            key={i}
            style={[waveStyles.bar, {
              height,
              backgroundColor: isActive
                ? `rgba(0,133,91,${0.4 + normalised * 0.6})`
                : colors.outlineVariant,
            }]}
          />
        );
      })}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, height: 64, paddingHorizontal: spacing.md },
  bar: { width: 4, borderRadius: 2 },
});

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ accuracy }: { accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const color = pct >= 80 ? '#00B894' : pct >= 50 ? '#FDCB6E' : '#D63031';
  const label = pct >= 80 ? 'Xuất sắc' : pct >= 50 ? 'Khá tốt' : 'Thử lại';
  return (
    <View style={ringStyles.container}>
      <View style={[ringStyles.ring, { borderColor: color + '40' }]} />
      <View style={ringStyles.inner}>
        <Text style={[ringStyles.pct, { color }]}>{pct}%</Text>
        <Text style={[ringStyles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 8 },
  inner: { alignItems: 'center' },
  pct: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});

// ─── Phoneme Diff ─────────────────────────────────────────────────────────────

function PhonemeDiff({ targetIpa, heardIpa }: { targetIpa: string; heardIpa: string }) {
  const strip = (s: string) => s.replace(/[\/]/g, '').trim();
  const t = strip(targetIpa).split('');
  const h = strip(heardIpa).split('');
  const maxLen = Math.max(t.length, h.length);
  return (
    <View style={diffStyles.container}>
      <Text style={diffStyles.label}>Phân tích ngữ âm (IPA):</Text>
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
  charBox: { minWidth: 24, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, backgroundColor: '#E8F5E9', alignItems: 'center' },
  charBoxWrong: { backgroundColor: '#FFEBEE' },
  charHeard: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  charWrong: { color: '#C62828' },
  charTarget: { fontSize: 10, color: '#C62828', fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Status = 'idle' | 'recording' | 'processing' | 'success' | 'fail';

export default function DailyPronounceScreen() {
  const router = useRouter();
  const { startRecording, stopRecording, isRecording, meteringValue } = useRecorder();
  const { speak, isSpeaking } = useTTS();
  const completeTask = useDailyStore(s => s.completeTask);
  const tasks = useDailyStore(s => s.tasks);

  // Lấy từ từ daily store
  const speakingTask = tasks.find(t => t.type === 'speaking');
  const targetWord = speakingTask?.title.split(': ')[1] ?? '';
  const isAlreadyCompleted = speakingTask?.status === 'completed';

  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<{
    accuracy: number;
    transcription: string;
    targetIpa: string;
    heardIpa: string;
  } | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [passed, setPassed] = useState(isAlreadyCompleted);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (targetWord) setTimeout(() => speak(targetWord), 600);
  }, [targetWord]);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
      pulseOpacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 600 }), withTiming(0, { duration: 600 })), -1, true);
    } else {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const recordingStartedRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);
  const MIN_RECORD_MS = 1000;

  const handleToggleRecord = async () => {
    if (isRecording || recordingStartedRef.current) {
      const elapsed = Date.now() - recordingStartTimeRef.current;
      if (elapsed < MIN_RECORD_MS) await new Promise(r => setTimeout(r, MIN_RECORD_MS - elapsed));
      recordingStartedRef.current = false;
      setStatus('processing');
      try {
        const uri = await stopRecording();
        if (uri) await processAudio(uri);
        else setStatus('idle');
      } catch {
        setStatus('idle');
      }
      return;
    }
    try {
      const { status: perm } = await Audio.requestPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền Microphone để sử dụng tính năng này.');
        return;
      }
      setStatus('recording');
      setFeedback(null);
      await startRecording();
      recordingStartedRef.current = true;
      recordingStartTimeRef.current = Date.now();
    } catch {
      setStatus('idle');
    }
  };

  const processAudio = async (uri: string) => {
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const res = await api.post<{
        accuracy: number;
        transcription: string;
        target_ipa: string;
        heard_ipa: string;
      }>('/ai/pronunciation-check', { audio: base64Audio, target_text: targetWord });

      const { accuracy, transcription, target_ipa, heard_ipa } = res;
      setFeedback({ accuracy, transcription, targetIpa: target_ipa, heardIpa: heard_ipa });
      setAttempts(a => a + 1);

      if (accuracy >= 0.85) {
        setStatus('success');
        setPassed(true);
        completeTask('daily-speaking');
      } else {
        setStatus('fail');
        if (accuracy < 0.5) setTimeout(() => speak(targetWord), 800);
      }
    } catch {
      setStatus('idle');
    }
  };

  if (!targetWord) {
    return (
      <Screen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Quest</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome name="check-circle" size={48} color={colors.tertiary} />
          <Text style={styles.emptyText}>Không có nhiệm vụ phát âm hôm nay</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Quest</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Daily badge */}
        <View style={styles.dailyBadge}>
          <FontAwesome name="star" size={13} color="#FDCB6E" />
          <Text style={styles.dailyBadgeText}>NHIỆM VỤ HÀNG NGÀY</Text>
          {passed && <FontAwesome name="check-circle" size={13} color={colors.tertiary} style={{ marginLeft: 4 }} />}
        </View>

        {/* Word card — cố định, không có nút "Từ khác" */}
        <View style={[styles.wordCard, passed && styles.wordCardPassed]}>
          <Text style={styles.wordLabel}>Hãy phát âm từ:</Text>
          <View style={styles.wordRow}>
            <Text style={[styles.targetWord, passed && { color: colors.tertiary }]}>{targetWord}</Text>
            <TouchableOpacity
              style={[styles.ttsBtn, isSpeaking && styles.ttsBtnActive]}
              onPress={() => speak(targetWord)}
              disabled={isSpeaking}
            >
              <FontAwesome name="volume-up" size={20} color={isSpeaking ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {attempts > 0 && (
            <Text style={styles.attemptsText}>{attempts} lần thử</Text>
          )}
          {passed && (
            <View style={styles.passedBadge}>
              <FontAwesome name="check" size={11} color={colors.tertiary} />
              <Text style={styles.passedText}>Hoàn thành!</Text>
            </View>
          )}
        </View>

        {/* Waveform */}
        <View style={styles.waveCard}>
          <Waveform metering={meteringValue} isActive={isRecording} />
          <Text style={styles.waveHint}>
            {status === 'idle' && (passed ? 'Thử lại để cải thiện điểm' : 'Nhấn mic để bắt đầu')}
            {status === 'recording' && '🔴 Đang ghi âm... nhấn ■ để dừng'}
            {status === 'processing' && 'AI đang phân tích...'}
            {status === 'success' && '✓ Xuất sắc! Quest hoàn thành (≥85%)'}
            {status === 'fail' && 'Thử lại nhé!'}
          </Text>
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <ScoreRing accuracy={feedback.accuracy} />
            <View style={styles.feedbackRight}>
              <PhonemeDiff targetIpa={feedback.targetIpa} heardIpa={feedback.heardIpa} />
              <Text style={[styles.feedbackMsg, { color: feedback.accuracy >= 0.85 ? '#00B894' : '#D63031' }]}>
                {feedback.accuracy >= 0.85 ? 'Xuất sắc! Quest đã hoàn thành.'
                  : feedback.accuracy >= 0.7 ? 'Gần rồi! Cần đạt 85% để hoàn thành quest.'
                  : feedback.accuracy >= 0.5 ? 'Khá tốt, nhấn mạnh âm tiết hơn nhé.'
                  : 'Hãy thử lại, chú ý từng âm tiết.'}
              </Text>
            </View>
          </View>
        )}

        {/* Nút hoàn thành nếu đã pass */}
        {passed && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <FontAwesome name="check" size={16} color="#fff" />
            <Text style={styles.doneBtnText}>Xong — Quay lại</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Record button */}
      <View style={styles.footer}>
        <View style={styles.recordWrapper}>
          <Animated.View style={[styles.pulse, pulseStyle]} />
          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordingBtn, status === 'processing' && styles.processingBtn]}
            onPress={handleToggleRecord}
            disabled={status === 'processing'}
            activeOpacity={0.85}
          >
            {status === 'processing'
              ? <ActivityIndicator color="white" size="small" />
              : <FontAwesome name={isRecording ? 'stop' : 'microphone'} size={28} color="white" />
            }
          </TouchableOpacity>
        </View>
        <Text style={styles.recordHint}>
          {status === 'processing' ? 'AI đang phân tích...'
            : isRecording ? 'Nhấn ■ để dừng và chấm điểm'
            : 'Nhấn mic để bắt đầu nói'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },

  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 140 },

  dailyBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: '#FFF9E6',
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    alignSelf: 'center', borderWidth: 1, borderColor: '#FDCB6E',
  },
  dailyBadgeText: { fontSize: 11, fontWeight: '800', color: '#E17055', letterSpacing: 0.5 },

  wordCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl,
    alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  wordCardPassed: { borderColor: colors.tertiary, borderWidth: 2 },
  wordLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  targetWord: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: 1, flex: 1, textAlign: 'center' },
  ttsBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  ttsBtnActive: { backgroundColor: colors.primaryFixed, borderColor: colors.primary },
  attemptsText: { fontSize: 12, color: colors.textMuted },
  passedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.tertiary,
  },
  passedText: { fontSize: 12, fontWeight: '700', color: colors.tertiary },

  waveCard: {
    backgroundColor: '#F8F9FE', borderRadius: radius.xl, padding: spacing.md,
    alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  waveHint: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  feedbackCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  feedbackRight: { flex: 1, gap: spacing.sm },
  feedbackMsg: { fontSize: 13, fontWeight: '600', lineHeight: 20 },

  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.tertiary,
    borderRadius: radius.lg, padding: spacing.md,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  backLink: { marginTop: spacing.sm },
  backLinkText: { fontSize: 15, fontWeight: '700', color: colors.primary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: spacing.xxl, paddingTop: spacing.md,
    backgroundColor: 'rgba(247,249,251,0.95)',
    alignItems: 'center', gap: spacing.xs,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  recordWrapper: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.tertiary },
  recordBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  recordingBtn: { backgroundColor: '#D63031' },
  processingBtn: { backgroundColor: colors.outline },
  recordHint: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
});
