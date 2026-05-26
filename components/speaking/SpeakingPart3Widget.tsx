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

const PART3_DURATION = 300;
const SILENCE_THRESHOLD_DB = -50;
const SILENCE_DURATION_MS = 2500;

interface SpeakingPart3WidgetProps {
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

export function SpeakingPart3Widget({ onEndSession, onManualEnd, onExit }: SpeakingPart3WidgetProps) {
  const { speak, stop: stopTTS } = useTTS();
  const { startRecording, stopRecording, meteringValue, isRecording } = useRecorder();
  const { sessionId, currentPersonaId, appState, setAppState, lastFeedback, setFeedback, addTurn, prefilledTopic, prefilledPart } = useSpeakingStore();

  const [submitting, setSubmitting] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');

  const entranceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entranceAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  // VAD with longer silence (2.5s) — Part 3 expects deeper responses
  useVAD({
    meteringValue,
    isRecording,
    silenceThreshold: SILENCE_THRESHOLD_DB,
    silenceDurationMs: SILENCE_DURATION_MS,
    onSilenceDetected: async () => {
      const uri = await stopRecording();
      if (uri) handleVoiceSubmission(uri);
    },
    onVoiceResumed: () => setAppState('listening'),
  });

  useEffect(() => {
    if (appState === 'processing' && lastFeedback) {
      setAppState('speaking');
    }
  }, [appState, lastFeedback]);

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
        <Text style={styles.headerTitle}>Peak</Text>
        <View style={styles.headerRight}>
          <SpeakingTimer totalSeconds={PART3_DURATION} onTimeUp={onEndSession} />
          <TouchableOpacity onPress={confirmEndSession} style={styles.endBtn}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Topic banner */}
        <Animated.View style={{ opacity: entranceAnim }}>
          <View style={styles.topicBanner}>
            <FontAwesome name="commenting" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.topicText}>Speaking Part {prefilledPart} — Discussion</Text>
          </View>
        </Animated.View>

        {/* Feedback area */}
        <Animated.View style={[styles.feedbackArea, { opacity: entranceAnim }]}>
          {lastFeedback ? (
            <View style={styles.examinerBubble}>
              <Text style={styles.examinerLabel}>EXAMINER</Text>
              <Text style={styles.examinerText}>
                {lastFeedback.next_question || lastFeedback.response || 'Đang chờ...'}
              </Text>
            </View>
          ) : (
            <View style={styles.waitingArea}>
              <Text style={styles.waitingText}>The examiner will begin the discussion shortly...</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </Animated.View>

        {/* Status */}
        <Animated.View style={[styles.statusArea, { opacity: entranceAnim }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </Animated.View>
      </ScrollView>

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
  root: { flex: 1, backgroundColor: colors.background },
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, fontFamily: 'Montserrat' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  endBtn: {
    backgroundColor: colors.errorContainer, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
  },
  endBtnText: { fontSize: 12, fontWeight: '700', color: colors.onErrorContainer },

  topicBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.secondary,
  },
  topicText: { fontSize: 14, fontWeight: '700', color: colors.secondary },

  feedbackArea: { paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: spacing.lg },
  examinerBubble: {
    backgroundColor: '#ffffff', borderRadius: radius.md,
    padding: spacing.md, ...shadow.card,
  },
  examinerLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5, marginBottom: 4 },
  examinerText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  userBubble: {
    backgroundColor: '#ffffff', borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.primary,
    padding: spacing.md, ...shadow.card,
  },
  userLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, marginBottom: 4 },
  userText: { fontSize: 15, color: colors.text, fontStyle: 'italic', lineHeight: 22 },
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

  waitingArea: { alignItems: 'center', paddingVertical: spacing.xl },
  waitingText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  statusArea: { alignItems: 'center', paddingVertical: spacing.sm },
  statusText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

  footerContainer: {
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
