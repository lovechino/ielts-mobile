import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, Image, Animated, Easing } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { useRecorder } from '@/hooks/useRecorder';
import { useTTS } from '@/hooks/useTTS';
import { useVAD } from '@/hooks/useVAD';
import { submitTurn } from '@/lib/api/speaking';
import { SpeakingTimer } from './SpeakingTimer';

const PART_DURATIONS: Record<number, number> = { 1: 300, 2: 240, 3: 300 };

const PERSONA_DETAILS: Record<string, { name: string; subtitle: string; uri: string }> = {
  james: { name: 'James British', subtitle: 'PROFESSIONAL EXAMINER', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaq08xumLSIqTJIB9UIjAET-iVNDjXij2qKvFoWYegHkFl1sEWVA0Cm7_UM_qh7zgcWzR853TDUGjAT0cBX--abiNIqHg7eEhbkUHb0HEYLehbxcI0iXQsaaECikiRkvhCxNSp1ml_slsesUjx3c2ldlAJ3ONNUDa7MyhxOuqNdma03RAUEvMr3AV9L5ntJKfpFw109Y38YO9KkFy_yFKglrt8Ztddq9xqzRRi6EwDXmcUttyJdlL180pB2V2T37y_6bShI_cml0o' },
  emily: { name: 'Emily Australian', subtitle: 'IELTS COACHING EXPERT', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNYhNNKnIuYDJzNIsUzLh6eAvvYIz_0ukVVFbCnqC8-TftqD2-CGoWjN1b49V-3yY_EZ9ywvIwaO6BERxtIPpWxQu1iBol1rWGK3qbOOlYZMmtWLJQ52XhcA9zrykzt_T2Ofigvbi3eWA-Th8b5Y_jS1Yh-McHtDTQEfM25iel27cvSgdc8twXU3XTAo8vqgGiZ0emjGuRZYHFFJZOtaW5rcc8ieKKj99wCZvyLT6_MsSKX1raQOShMG97zZXDXoSkqWHv4b7PPls' },
  dr_chen: { name: 'Dr. Chen American', subtitle: 'ACADEMIC PROFESSOR', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCginfzaN4mhEwYhjnJDmTLW7wUIQRdfepSim1J_hfwpCNEotoeIrZ8PyoNVADkmn5myR4v0S5B7CnddjRpaAYuPwcauki8G46gdz48PPbt9Hrl9Qa1OIYQA5KmrSdC3EVP31LbV0qkz-_EVlzT5EzxmZvNDrBoQDpyQ_30PNhPevm0fTIhKPtIPqXzjRIKiuaPkY2oxDnzzB9B8caCW5EUAmAwfcJrJlEH4vwQdQbik0E1DZPgF_eOPBHkcdkUbmIFhYOSxXomsDw' },
  sarah: { name: 'Sarah American', subtitle: 'SENIOR EXAMINER', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUsy23WCURLBFoSepan61QgVQMj3aoICZRWCuA7P5KYFhyP7M6vK-_mOp2bayWHl5s0M-I_hqJZZRgytJqIG0GundrLWv6YuzwarQ73qeIw1wTImiju6i6H10pS3oqBN12SjJc02l_Msyq9t5x-1-dKjJa4vVz4NyE2Pc4X85DeHcXmLgzkYvjDFjJayI5JUDXDOWAE7hfq89HPWihwtMeAJKyU7xd7WSAKQjXYp-fsVR6G9hDT0wSVsqry_PJNyeZ8um1I93p2QI' },
};

const MAX_WAVE_BARS = 40;
const WAVE_COLORS = ['#0058be', '#2170e4', '#fd761a', '#ffb690', '#005ac2'];

function TopicPromptCard({ topic, partLabel, expanded, onToggle }: { topic: string; partLabel: string; expanded: boolean; onToggle: () => void }) {
  return (
    <View style={styles.promptCard}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.promptHeader}>
        <View style={styles.promptHeaderLeft}>
          <FontAwesome name="microphone" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
          <Text style={styles.promptTag}>{partLabel}</Text>
        </View>
        <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.outline} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.promptContent}>
          <Text style={styles.promptQuestion}>{topic || 'Speaking practice topic'}</Text>
        </View>
      )}
    </View>
  );
}

function ExaminerProfile({ personaId, state }: { personaId: string; state: string }) {
  const detail = PERSONA_DETAILS[personaId] || PERSONA_DETAILS.james;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isActive = state === 'speaking' || state === 'listening' || state === 'processing';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    if (isActive) { loop.start(); }
    else { glowAnim.setValue(0); }
    return () => loop.stop();
  }, [isActive, glowAnim]);

  const glowSize = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });
  const glowColor = state === 'listening' ? 'rgba(253, 118, 26, 0.2)' : 'rgba(0, 88, 190, 0.2)';

  return (
    <View style={styles.profileContainer}>
      <View style={styles.avatarWrapper}>
        {isActive && (
          <Animated.View
            style={[
              styles.avatarGlow,
              {
                backgroundColor: glowColor,
                transform: [{ scale: glowSize }],
                opacity: glowOpacity,
              },
            ]}
          />
        )}
        <View style={styles.avatarBorder}>
          <Image source={{ uri: detail.uri }} style={styles.avatarImg} />
        </View>
        {isActive && (
          <View style={styles.pulseDotWrapper}>
            <View style={[styles.pulseDot, state === 'listening' && { backgroundColor: colors.secondary }]} />
          </View>
        )}
      </View>
      <Text style={styles.profileTag}>{detail.subtitle}</Text>
      <Text style={styles.profileName}>{detail.name}</Text>
    </View>
  );
}

function VoiceWaveForm({ isRecording, metering, state }: { isRecording: boolean; metering: number; state: string }) {
  const barsRef = useRef<Array<{ anim: Animated.Value; color: string; baseH: number; peakH: number; duration: number }>>([]);

  if (barsRef.current.length === 0) {
    const userMode = state === 'listening';
    for (let i = 0; i < MAX_WAVE_BARS; i++) {
      const anim = new Animated.Value(userMode ? 30 : 15);
      barsRef.current.push({
        anim,
        color: WAVE_COLORS[Math.floor(Math.random() * WAVE_COLORS.length)],
        baseH: userMode ? 25 + Math.random() * 15 : 12 + Math.random() * 10,
        peakH: userMode ? 60 + Math.random() * 30 : 25 + Math.random() * 15,
        duration: userMode ? 0.3 + Math.random() * 0.3 : 0.8 + Math.random() * 0.6,
      });
    }
  }

  useEffect(() => {
    const userMode = state === 'listening';
    barsRef.current.forEach((b) => {
      b.baseH = userMode ? 25 + Math.random() * 15 : 12 + Math.random() * 10;
      b.peakH = userMode ? 60 + Math.random() * 30 : 25 + Math.random() * 15;
      b.duration = userMode ? 0.3 + Math.random() * 0.3 : 0.8 + Math.random() * 0.6;
    });
  }, [state]);

  useEffect(() => {
    const anims = barsRef.current.map((b) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b.anim, {
            toValue: b.peakH,
            duration: b.duration * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(b.anim, {
            toValue: b.baseH,
            duration: b.duration * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    );
    const parallel = Animated.parallel(anims);
    parallel.start();
    return () => parallel.stop();
  }, []);

  useEffect(() => {
    if (isRecording) {
      barsRef.current.forEach((b, idx) => {
        const h = Math.max(8, Math.min(90, metering * (idx % 2 === 0 ? 0.6 : 0.8)));
        b.anim.setValue(h);
      });
    }
  }, [isRecording, metering]);

  return (
    <View style={styles.waveContainer}>
      {barsRef.current.map((b, idx) => (
        <Animated.View
          key={idx}
          style={[styles.waveBar, { backgroundColor: b.color, height: b.anim }]}
        />
      ))}
    </View>
  );
}

function SpeechBubble({ label, text, italic, success }: { label: string; text: string; italic?: boolean; success?: boolean }) {
  return (
    <View style={[styles.bubbleCard, success && styles.successBubble]}>
      <Text style={[styles.bubbleLabel, success && styles.successLabel]}>{label}</Text>
      <Text style={[styles.bubbleText, italic && styles.italicText]}>{text}</Text>
    </View>
  );
}

function FeedbackPanel({ band, feedback, correction }: { band: number; feedback: string; correction: string | null }) {
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.feedbackLabel}>TURN EVALUATION</Text>
        <Text style={styles.bandBadge}>Band {band}</Text>
      </View>
      <Text style={styles.feedbackText}>{feedback}</Text>
      {correction && (
        <View style={styles.correctionBox}>
          <Text style={styles.correctionLabel}>Suggested Native Correction:</Text>
          <Text style={styles.correctionText}>{correction}</Text>
        </View>
      )}
    </View>
  );
}

interface LiveSpeakingWidgetProps {
  mode?: 'test' | 'practice';
  onEndSession?: () => void;
  onManualEnd?: () => void;
  onExit?: () => void;
}

async function readAudioFileBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri.startsWith('data:') ? uri.split(',')[1] : uri;
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  await FileSystem.deleteAsync(uri, { idempotent: true });
  return b64;
}

export function LiveSpeakingWidget({ mode = 'practice', onEndSession, onManualEnd, onExit }: LiveSpeakingWidgetProps) {
  const { speak, stop: stopTTS } = useTTS();
  const { startRecording, stopRecording, meteringValue, isRecording } = useRecorder();
  const { sessionId, currentPersonaId, appState, setAppState, lastFeedback, setFeedback, addTurn, prefilledTopic, prefilledPart } = useSpeakingStore();

  const [promptExpanded, setPromptExpanded] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');

  const timerDuration = PART_DURATIONS[prefilledPart] || 300;

  const entranceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entranceAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  useVAD({
    meteringValue,
    isRecording,
    onSilenceDetected: async () => {
      const uri = await stopRecording();
      if (uri) handleVoiceSubmission(uri);
    },
    onVoiceResumed: () => setAppState('listening'),
  });

  useEffect(() => {
    if (appState === 'speaking' && lastFeedback?.response) {
      speak(lastFeedback.response, currentPersonaId, undefined, () => {
        setAppState('listening');
        if (lastFeedback.next_question) {
          speak(lastFeedback.next_question, currentPersonaId);
        }
      });
    }
  }, [lastFeedback, appState, currentPersonaId, speak]);

  useEffect(() => () => stopTTS(), []);

  const updateStore = (res: any) => {
    setLocalTranscript(res.transcript || '');
    setFeedback(res);
    addTurn(res);
  };

  const handleVoiceSubmission = async (uri: string) => {
    setSubmitting(true);
    setAppState('processing');
    try {
      const base64 = await readAudioFileBase64(uri);
      if (!base64 || !base64.trim()) throw new Error('EMPTY');
      if (!sessionId) return;
      const res = await submitTurn({ sessionId, audio: base64, format: Platform.OS === 'web' ? 'webm' : 'm4a' });
      updateStore(res);
    } catch (err: any) {
      Alert.alert('Error', err.message === 'EMPTY' ? 'Please speak longer.' : 'Failed to process audio.');
      setAppState('listening');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEndSession = useCallback(() => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this speaking session and see your report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End & View Report', style: 'destructive', onPress: () => onManualEnd?.() },
      ]
    );
  }, [onManualEnd]);

  const handleMicPress = async () => {
    stopTTS();
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) handleVoiceSubmission(uri);
    } else {
      setAppState('listening');
      await startRecording();
    }
  };

  const statusText = appState === 'loading' ? 'Examiner preparing...'
    : appState === 'speaking' ? 'Examiner speaking...'
    : appState === 'listening' ? 'Listening to you...'
    : appState === 'processing' ? 'Analyzing speech...'
    : 'Connected';

  const partLabel = `Speaking Part ${prefilledPart}`;

  const { name } = PERSONA_DETAILS[currentPersonaId] || PERSONA_DETAILS.james;

  return (
    <View style={styles.widgetContainer}>
      {/* Background mesh */}
      <View style={styles.bgMesh1} pointerEvents="none" />
      <View style={styles.bgMesh2} pointerEvents="none" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: entranceAnim }]}>
        <TouchableOpacity onPress={onExit} style={styles.headerBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IELTS Master</Text>
        <View style={styles.headerRight}>
          <SpeakingTimer totalSeconds={timerDuration} onTimeUp={onEndSession} />
          <TouchableOpacity onPress={confirmEndSession} style={styles.endBtn}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Prompt card */}
      <Animated.View style={{ opacity: entranceAnim }}>
        <TopicPromptCard topic={prefilledTopic} partLabel={partLabel} expanded={promptExpanded} onToggle={() => setPromptExpanded(!promptExpanded)} />
      </Animated.View>

      {/* Central area */}
      <Animated.View style={[styles.centralArea, { opacity: entranceAnim }]}>
        <ExaminerProfile personaId={currentPersonaId} state={appState} />
        <VoiceWaveForm isRecording={isRecording} metering={meteringValue} state={appState} />
        <Text style={styles.statusLabel}>{statusText}</Text>
      </Animated.View>

      {/* Speech & feedback */}
      <Animated.View style={[styles.contentWrap, { opacity: entranceAnim }]}>
        <SpeechBubble label={`${name.toUpperCase()} (EXAMINER)`} text={lastFeedback ? (lastFeedback.next_question || lastFeedback.response || 'Đang chờ giám khảo...') : 'Đang tải bài thực hành...'} />
        {localTranscript ? <SpeechBubble label="YOUR SPEECH" text={`"${localTranscript}"`} italic success /> : null}
        {lastFeedback?.feedback ? <FeedbackPanel band={lastFeedback.band_estimate} feedback={lastFeedback.feedback} correction={lastFeedback.correction} /> : null}
        <View style={{ height: 100 }} />
      </Animated.View>

      {/* Bottom mic */}
      <Animated.View style={[styles.footerContainer, { opacity: entranceAnim }]}>
        <TouchableOpacity
          onPress={handleMicPress}
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <FontAwesome name="microphone" size={28} color={isRecording ? '#fff' : colors.primary} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: { flex: 1, paddingHorizontal: spacing.md, position: 'relative' },
  bgMesh1: {
    position: 'absolute', top: '15%', left: -100, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(0, 88, 190, 0.04)',
    transform: [{ scaleX: 1.5 }],
  },
  bgMesh2: {
    position: 'absolute', bottom: '10%', right: -80, width: 250, height: 250,
    borderRadius: 125, backgroundColor: 'rgba(253, 118, 26, 0.04)',
    transform: [{ scaleX: 1.5 }],
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, fontFamily: 'Montserrat' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  endBtn: {
    backgroundColor: colors.errorContainer, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
  },
  endBtnText: { fontSize: 12, fontWeight: '700', color: colors.onErrorContainer },

  promptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.secondary,
    padding: spacing.md, marginBottom: spacing.sm,
    ...shadow.card,
  },
  promptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promptHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  promptTag: { fontSize: 11, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5 },
  promptContent: { marginTop: spacing.sm, borderTopWidth: 1, borderColor: 'rgba(236, 238, 240, 0.6)', paddingTop: spacing.sm },
  promptQuestion: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },

  centralArea: { alignItems: 'center', marginVertical: spacing.md, flex: 1, justifyContent: 'center' },
  profileContainer: { alignItems: 'center' },
  avatarWrapper: { position: 'relative', width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: {
    position: 'absolute', width: 132, height: 132, borderRadius: 66,
  },
  avatarBorder: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: colors.primary, padding: 2,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 46, backgroundColor: '#eceef0' },
  pulseDotWrapper: {
    position: 'absolute', bottom: 4, right: 4, width: 20, height: 20,
    borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center',
    justifyContent: 'center', borderWidth: 1, borderColor: '#eceef0',
  },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.tertiary },
  profileTag: { fontSize: 10, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5, marginTop: spacing.sm },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.primary, marginTop: 2 },

  waveContainer: { flexDirection: 'row', gap: 3, height: 90, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md, paddingHorizontal: spacing.lg },
  waveBar: { width: 5, borderRadius: 3, minHeight: 4 },

  statusLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.xs },

  contentWrap: { gap: spacing.sm, marginTop: spacing.xs },
  bubbleCard: { backgroundColor: '#ffffff', borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  successBubble: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  bubbleLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5, marginBottom: 4 },
  successLabel: { color: colors.primary },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  italicText: { fontStyle: 'italic', fontWeight: '500' },
  feedbackCard: { backgroundColor: '#f0fdf4', borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.tertiary, padding: spacing.md, ...shadow.card },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  feedbackLabel: { fontSize: 10, fontWeight: '700', color: colors.tertiary, letterSpacing: 0.5 },
  bandBadge: { fontSize: 12, fontWeight: '700', color: colors.tertiary, backgroundColor: '#e6f7ed', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  feedbackText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  correctionBox: { borderTopWidth: 1, borderColor: '#d1fae5', marginTop: spacing.sm, paddingTop: spacing.sm },
  correctionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  correctionText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },

  footerContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
  },
  micBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceef0',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  micBtnActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
});
