import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, Animated, Easing, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { useRecorder } from '@/hooks/useRecorder';
import { useTTS } from '@/hooks/useTTS';
import { useVAD } from '@/hooks/useVAD';
import { submitTurn } from '@/lib/api/speaking';
import { SpeakingTimer } from './SpeakingTimer';
import { PreparationTimer } from './PreparationTimer';
import { CueCard } from './CueCard';

const SPEAK_DURATION = 120;

interface SpeakingPart2WidgetProps {
  onEndSession?: () => void;
  onManualEnd?: () => void;
  onExit?: () => void;
}

async function readAudioFileBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    if (uri.startsWith('data:')) return uri.split(',')[1];
    if (uri.startsWith('blob:')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return uri;
  }
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  await FileSystem.deleteAsync(uri, { idempotent: true });
  return b64;
}

export function SpeakingPart2Widget({ onEndSession, onManualEnd, onExit }: SpeakingPart2WidgetProps) {
  const { speak, stop: stopTTS } = useTTS();
  const { startRecording, stopRecording, meteringValue, isRecording } = useRecorder();
  const {
    sessionId, currentPersonaId, appState, setAppState,
    lastFeedback, setFeedback, addTurn, prefilledTopic,
    lessonParts, currentPartIndex, setPartIndex, fullContent,
    prepTimeLeft, setPrepTimeLeft, turns,
  } = useSpeakingStore();

  const currentPart = lessonParts[currentPartIndex] || 2;
  const currentPartData = fullContent?.[`part${currentPart}`];
  const dynamicTopic = currentPartData?.cue_card || prefilledTopic;

  const [submitting, setSubmitting] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [ending, setEnding] = useState(false);

  const entranceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entranceAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (appState === 'processing' && lastFeedback) {
      setAppState('speaking');
    }
  }, [appState, lastFeedback]);

  useEffect(() => () => stopTTS(), []);

  // On mount: skip TTS intro, go directly to preparing
  useEffect(() => {
    if (appState === 'speaking' && !lastFeedback) {
      setAppState('preparing');
    }
  }, []);

  // After each feedback, speak the response then go to listening
  useEffect(() => {
    if (appState === 'speaking' && turns.length > 0 && lastFeedback?.response) {
      speak(lastFeedback.response, currentPersonaId, undefined, () => {
        setAppState('listening');
        if (lastFeedback.next_question) {
          speak(lastFeedback.next_question, currentPersonaId);
        }
      });
    }
  }, [lastFeedback, appState, currentPersonaId, speak, turns.length]);

  const handleVoiceSubmission = async (uri: string) => {
    setSubmitting(true);
    setAppState('processing');
    try {
      const base64 = await readAudioFileBase64(uri);
      if (!base64 || !base64.trim()) throw new Error('EMPTY');
      if (!sessionId) return;
      const res = await submitTurn({ sessionId, audio: base64, format: Platform.OS === 'web' ? 'webm' : 'm4a' });
      
      setLocalTranscript(res.transcript || '');
      setFeedback(res);
      addTurn(res);

      // Handle Transition command from AI
      if (res.transition_to_part) {
        const nextIdx = lessonParts.indexOf(res.transition_to_part);
        if (nextIdx !== -1) {
          setTimeout(() => {
            setPartIndex(nextIdx);
          }, 1500);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message === 'EMPTY' ? 'Please speak longer.' : 'Failed to process audio.');
      setAppState('listening');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEndSession = useCallback(async () => {
    // On web, Alert.alert callbacks don't work — use window.confirm instead
    const confirmed = Platform.OS === 'web'
      ? window.confirm('End this speaking session and see your report?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'End Session',
            'Are you sure you want to end this speaking session and see your report?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'End & View Report', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    setSessionEnded(true);
    setEnding(true);
    if (isRecording) {
      await stopRecording();
    }
    stopTTS();
    await onManualEnd?.();
    setEnding(false);
  }, [onManualEnd, isRecording, stopRecording, stopTTS]);

  // Recording phase — no VAD, user presses mic to stop
  const handleMicPress = async () => {
    stopTTS();
    if (isRecording) {
      // Luôn cho phép stop recording
      const uri = await stopRecording();
      if (uri && !submitting) handleVoiceSubmission(uri);
    } else {
      if (submitting) return;
      setAppState('recording');
      await startRecording();
    }
  };

  // Post-recording listening/feedback — use VAD for follow-up turns
  // For follow-up turns after the main long turn, use standard voice detection

  const statusText = appState === 'loading' ? 'Examiner preparing...'
    : appState === 'speaking' ? 'Examiner speaking...'
    : appState === 'preparing' ? 'Prepare your answer...'
    : appState === 'recording' ? 'Recording your answer...'
    : appState === 'processing' ? 'Analyzing speech...'
    : appState === 'listening' ? 'Listening to you...'
    : 'Connected';

  // VAD for follow-up turns only (after first submission)
  const hasSubmitted = turns.length > 0;
  useVAD({
    meteringValue,
    isRecording: isRecording && hasSubmitted,
    onSilenceDetected: async () => {
      if (!hasSubmitted) return;
      const uri = await stopRecording();
      if (uri) handleVoiceSubmission(uri);
    },
    onVoiceResumed: () => {
      if (hasSubmitted) setAppState('listening');
    },
    silenceDurationMs: 2500,
  });

  if (ending) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '600', color: colors.textSecondary }}>
          Đang tổng hợp kết quả...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Background mesh */}
      <View style={styles.bgMesh1} pointerEvents="none" />
      <View style={styles.bgMesh2} pointerEvents="none" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: entranceAnim }]}>
        <TouchableOpacity onPress={onExit} style={styles.headerBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Talko</Text>
        <View style={styles.headerRight}>
          {appState === 'preparing' ? (
            <PreparationTimer
              timeLeft={prepTimeLeft}
              onTimeUp={() => {
                setPrepTimeLeft(60);
                setAppState('recording');
                startRecording();
              }}
              onTick={setPrepTimeLeft}
            />
          ) : (
            <SpeakingTimer totalSeconds={SPEAK_DURATION} onTimeUp={onEndSession} stopped={sessionEnded} />
          )}
          <TouchableOpacity onPress={confirmEndSession} style={styles.endBtn}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scrollable content */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Cue Card — always visible */}
        <Animated.View style={{ opacity: entranceAnim, marginTop: spacing.sm }}>
          <CueCard topic={dynamicTopic} />
        </Animated.View>

        {/* State-specific center area */}
        <Animated.View style={[styles.centerArea, { opacity: entranceAnim }]}>
          {appState === 'preparing' && (
            <View style={styles.prepContainer}>
              <FontAwesome name="clock-o" size={48} color={colors.primary} />
              <Text style={styles.prepTitle}>Prepare Your Answer</Text>
              <Text style={styles.prepHint}>
                You have {prepTimeLeft} seconds to plan. Make notes on the cue card points.
              </Text>
            </View>
          )}

          {(appState === 'recording' || appState === 'processing') && (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingDotRow}>
                <View style={[styles.recordingDot, appState === 'processing' && styles.recordingDotProcessing]} />
                <Text style={styles.recordingDotLabel}>
                  {appState === 'processing' ? 'Analyzing...' : 'REC'}
                </Text>
              </View>
              <Text style={styles.recordingText}>
                {appState === 'processing' ? 'Sending your answer...' : 'Speak continuously. Press mic when done.'}
              </Text>
            </View>
          )}

          {appState === 'listening' && (
            <View style={styles.listeningContainer}>
              <FontAwesome name="commenting" size={40} color={colors.secondary} />
              <Text style={styles.listeningText}>Examiner is speaking...</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom mic — not absolute */}
      {(appState === 'preparing' || appState === 'recording' || appState === 'listening') && (
        <Animated.View style={[styles.footerContainer, { opacity: entranceAnim }]}>
          <TouchableOpacity
            onPress={handleMicPress}
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            activeOpacity={0.8}
          >
            {submitting && !isRecording ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <FontAwesome name="microphone" size={28} color={isRecording ? '#fff' : colors.primary} />
            )}
          </TouchableOpacity>
          {appState === 'preparing' && (
            <Text style={styles.micHint}>Tap mic when ready to speak</Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, position: 'relative' },
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
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, fontFamily: 'Montserrat' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  endBtn: {
    backgroundColor: colors.errorContainer, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
  },
  endBtnText: { fontSize: 12, fontWeight: '700', color: colors.onErrorContainer },

  centerArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  prepContainer: { alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  prepTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  prepHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  recordingContainer: { alignItems: 'center', gap: spacing.md },
  recordingDotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recordingDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#e53e3e',
  },
  recordingDotProcessing: { backgroundColor: colors.textSecondary },
  recordingDotLabel: { fontSize: 11, fontWeight: '800', color: '#e53e3e', letterSpacing: 1 },
  recordingText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },

  listeningContainer: { alignItems: 'center', gap: spacing.md },
  listeningText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

  feedbackArea: { paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: spacing.md },
  transcriptBox: {
    backgroundColor: '#ffffff', borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.primary,
    padding: spacing.md, ...shadow.card,
  },
  transcriptLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, marginBottom: 4 },
  transcriptText: { fontSize: 15, color: colors.text, fontStyle: 'italic', lineHeight: 22 },
  feedbackMain: {
    backgroundColor: '#f0fdf4', borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.tertiary,
    padding: spacing.md, ...shadow.card,
  },
  feedbackHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  feedbackMainLabel: { fontSize: 10, fontWeight: '700', color: colors.tertiary, letterSpacing: 0.5 },
  bandBadge: { fontSize: 12, fontWeight: '700', color: colors.tertiary, backgroundColor: '#e6f7ed', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  feedbackMainText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  correctionBox: { borderTopWidth: 1, borderColor: '#d1fae5', marginTop: spacing.sm, paddingTop: spacing.sm },
  correctionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  correctionText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },

  footerContainer: {
    alignItems: 'center', paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
  },
  micHint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
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
