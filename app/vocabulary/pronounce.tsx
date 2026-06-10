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
  ActivityIndicator, ScrollView, Dimensions, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
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
import { getRandomWords } from '@/lib/offline/dictionary';
import { useTTS } from '@/hooks/useTTS';
import { AssetManager, AssetStatus } from '@/lib/offline/assetManager';
import { AIModelManager } from '@/components/vocabulary/AIModelManager';
import { AIInference } from '@/lib/offline/aiInference';
import { PhonemeScorer } from '@/lib/offline/phonemeScorer';

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

function PhonemeDiff({ targetIpa, heardIpa }: { targetIpa: string; heardIpa: string }) {
  // Chuẩn hóa: bỏ dấu / và các khoảng trắng dư thừa
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
  charBox: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  charBoxWrong: { backgroundColor: '#FFEBEE' },
  charHeard: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  charWrong: { color: '#C62828' },
  charTarget: { fontSize: 10, color: '#C62828', fontWeight: '700' },
});

// ─── Attempt History ──────────────────────────────────────────────────────────

interface Attempt {
  accuracy: number;
  transcription: string;
  heardIpa?: string;
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
            <Text style={histStyles.heard} numberOfLines={1}>
              "{a.transcription}" {a.heardIpa ? <Text style={histStyles.ipaSmall}>{a.heardIpa}</Text> : null}
            </Text>
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
  ipaSmall: { fontSize: 11, color: colors.textMuted, fontStyle: 'normal' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Status = 'idle' | 'recording' | 'processing' | 'success' | 'fail';

export default function PronunciationScreen() {
  const router = useRouter();
  const { word: paramWord, ipa: paramIpa, meaning: paramMeaning } = useLocalSearchParams<{ word?: string; ipa?: string; meaning?: string }>();
  const { startRecording, stopRecording, isRecording, meteringValue } = useRecorder();
  const [targetWord, setTargetWord] = useState('');
  const [targetIpa, setTargetIpa] = useState('');
  const [targetMeaning, setTargetMeaning] = useState('');
  const [wordLoading, setWordLoading] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<{ 
    accuracy: number; 
    transcription: string;
    targetIpa: string;
    heardIpa: string;
  } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const completeTask = useDailyStore(s => s.completeTask);
  const { speak, isSpeaking } = useTTS();
  // Chỉ dùng paramWord / daily task ở lần load đầu tiên
  // Khi user bấm "Từ khác" thì isFirstLoad = false → random từ DB
  const isFirstLoadRef = useRef(true);

  // Pulse animation for record button
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  /** Lấy từ tiếp theo để luyện — random từ DB, bỏ qua daily/param */
  const loadNextWord = useCallback(async () => {
    setWordLoading(true);
    setFeedback(null);
    setStatus('idle');
    setAttempts([]);

    const firstLoad = isFirstLoadRef.current;
    isFirstLoadRef.current = false;

    // Lần đầu vào: nếu có paramWord từ router (vd: từ IPA Chart)
    if (firstLoad && paramWord) {
      setTargetWord(paramWord);
      setTargetIpa(paramIpa || '');
      setTargetMeaning(paramMeaning || '');
      setWordLoading(false);
      setTimeout(() => speak(paramWord), 600);
      return;
    }

    // Random từ DB
    try {
      const words = await getRandomWords(20);
      const suitable = words.filter(w => w.word && w.word.length >= 4 && w.word.length <= 12);
      const pick = suitable[Math.floor(Math.random() * suitable.length)] ?? words[0];
      if (pick) {
        setTargetWord(pick.word);
        setTargetIpa(pick.pronunciation || '');
        setTargetMeaning(pick.definition_vi || pick.definition || '');
        setTimeout(() => speak(pick.word), 600);
      } else {
        const defaults = ['beautiful', 'important', 'together', 'because', 'different', 'understand'];
        const picked = defaults[Math.floor(Math.random() * defaults.length)];
        setTargetWord(picked);
        setTargetIpa('');
        setTargetMeaning('');
        setTimeout(() => speak(picked), 600);
      }
    } catch {
      setTargetWord('beautiful');
      setTargetIpa('/ˈbjuːtɪfəl/');
      setTargetMeaning('đẹp, xinh đẹp');
      setTimeout(() => speak('beautiful'), 600);
    } finally {
      setWordLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNextWord();
  }, [loadNextWord]);

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

  // ── Toggle recording (tap on / tap off) ─────────────────────────────────────
  const recordingStartedRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);
  const MIN_RECORD_MS = 1000; // Tối thiểu 1 giây để Whisper có đủ dữ liệu

  const handleToggleRecord = async () => {
    // Đang recording → dừng lại
    if (isRecording || recordingStartedRef.current) {
      const elapsed = Date.now() - recordingStartTimeRef.current;
      if (elapsed < MIN_RECORD_MS) {
        const wait = MIN_RECORD_MS - elapsed;
        console.log(`[Pronounce] Waiting ${wait}ms for minimum audio...`);
        await new Promise(r => setTimeout(r, wait));
      }
      recordingStartedRef.current = false;
      setStatus('processing');
      try {
        const uri = await stopRecording();
        if (uri) {
          await processAudio(uri);
        } else {
          console.warn('[Pronounce] No audio URI');
          setStatus('idle');
        }
      } catch (err) {
        console.error('[Pronounce] Stop failed:', err);
        setStatus('idle');
      }
      return;
    }

    // Chưa recording → bắt đầu
    try {
      const { status: permStatus } = await Audio.requestPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền Microphone để sử dụng tính năng này.');
        return;
      }
      setStatus('recording');
      setFeedback(null);
      await startRecording();
      recordingStartedRef.current = true;
      recordingStartTimeRef.current = Date.now();
    } catch (err) {
      console.error('[Pronounce] Start failed:', err);
      setStatus('idle');
    }
  };

  const processAudio = async (uri: string) => {
    console.log('[Pronounce] Processing audio:', uri);
    try {
      const status = await AssetManager.getStatus('whisper-tiny-en');
      let res;

      if (status.isDownloaded) {
        console.log('[Pronounce] Using Offline AI...');
        const transcript = await AIInference.runWhisper(uri);
        // Fallback or combine with offline scoring logic later
        // For now, let's still call API but mark as "Offline Processed" in logs
        console.log('[Pronounce] Offline transcript:', transcript);
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      res = await api.post<{
        accuracy: number;
        transcription: string;
        target_text: string;
        target_ipa: string;
        heard_ipa: string;
        status: 'excellent' | 'good' | 'try_again';
      }>('/ai/pronunciation-check', {
        audio: base64Audio,
        target_text: targetWord,
      });

      console.log('[Pronounce] API Response:', res);

      const { accuracy, transcription, target_ipa, heard_ipa } = res;
      setFeedback({ accuracy, transcription, targetIpa: target_ipa, heardIpa: heard_ipa });
      setStatus(accuracy >= 0.7 ? 'success' : 'fail');
      setAttempts(prev => [
        { accuracy, transcription, heardIpa: heard_ipa, timestamp: Date.now() },
        ...prev.slice(0, 4),
      ]);
      if (accuracy >= 0.7) completeTask('daily-speaking');

      // Auto-play TTS khi phát âm kém (< 50%) để user nghe lại cách đọc đúng
      if (accuracy < 0.5) {
        setTimeout(() => speak(targetWord), 800);
      }
    } catch (err) {
      console.error('[Pronounce] processAudio failed:', err);
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
        <AIModelManager modelId="whisper-tiny-en" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Target word card */}
        <View style={styles.wordCard}>
          <Text style={styles.wordLabel}>Hãy phát âm từ:</Text>
          {wordLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <>
              <View style={styles.wordRow}>
                <Text style={styles.targetWord}>{targetWord}</Text>
                {/* Nút loa — nghe cách đọc chuẩn */}
                <TouchableOpacity
                  style={[styles.ttsBtn, isSpeaking && styles.ttsBtnActive]}
                  onPress={() => speak(targetWord)}
                  disabled={isSpeaking}
                >
                  <FontAwesome
                    name={isSpeaking ? 'volume-up' : 'volume-up'}
                    size={20}
                    color={isSpeaking ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {targetIpa ? <Text style={styles.ipaText}>{targetIpa}</Text> : null}
              {targetMeaning ? <Text style={styles.meaningText}>{targetMeaning}</Text> : null}
            </>
          )}
          <View style={styles.wordActions}>
            {bestAttempt && (
              <View style={styles.bestBadge}>
                <FontAwesome name="star" size={11} color="#FDCB6E" />
                <Text style={styles.bestText}>Tốt nhất: {Math.round(bestAttempt.accuracy * 100)}%</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.nextWordBtn}
              onPress={loadNextWord}
              disabled={status === 'recording' || status === 'processing'}
            >
              <FontAwesome name="random" size={13} color={colors.primary} />
              <Text style={styles.nextWordText}>Từ khác</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Waveform */}
        <View style={styles.waveCard}>
          <Waveform metering={meteringValue} isActive={isRecording} />
          <Text style={styles.waveHint}>
            {status === 'idle' && 'Nhấn mic để bắt đầu'}
            {status === 'recording' && '🔴 Đang ghi âm... nhấn ■ để dừng'}
            {status === 'processing' && 'AI đang phân tích...'}
            {status === 'success' && '✓ Phát âm tốt!'}
            {status === 'fail' && 'Thử lại nhé!'}
          </Text>
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <ScoreRing accuracy={feedback.accuracy} />
            <View style={styles.feedbackRight}>
              <PhonemeDiff targetIpa={feedback.targetIpa} heardIpa={feedback.heardIpa} />
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
            onPress={handleToggleRecord}
            disabled={status === 'processing'}
            activeOpacity={0.85}
          >
            {status === 'processing' ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <FontAwesome
                name={isRecording ? 'stop' : 'microphone'}
                size={28}
                color="white"
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.recordHint}>
          {status === 'processing'
            ? 'AI đang phân tích...'
            : isRecording
            ? 'Nhấn ■ để dừng và chấm điểm'
            : 'Nhấn mic để bắt đầu nói'}
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
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  targetWord: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  ttsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ttsBtnActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primary,
  },
  ipaText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  meaningText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
  },
  nextWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFixed,
  },
  nextWordText: { fontSize: 12, fontWeight: '700', color: colors.primary },
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
