/**
 * Listening Game (context-aware) — nghe TTS, gõ từ đúng.
 * Khác với ListenType (dùng random words) — game này dùng từ của lộ trình.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { colors, spacing, radius } from '@/theme/tokens';
import { ContextWord } from '@/lib/offline/vocabContext';
import { GameResult } from './GameResult';
import { useTTS } from '@/hooks/useTTS';
import { FontAwesome } from '@expo/vector-icons';

interface ListeningGameProps {
  words: ContextWord[];
  onFinish: (coins: number) => void;
}

export function ListeningGame({ words, onFinish }: ListeningGameProps) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const { speak, isSpeaking } = useTTS();

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const word = words[index];

  useEffect(() => {
    setInput('');
    setResult(null);
    setPlayCount(0);
    // Auto-play khi chuyển từ
    setTimeout(() => { speak(word.word); setPlayCount(1); inputRef.current?.focus(); }, 400);
  }, [index]);

  const handlePlay = () => {
    speak(word.word);
    setPlayCount(c => c + 1);
  };

  const handleSubmit = useCallback(() => {
    if (!input.trim() || result !== null) return;
    const isCorrect = input.trim().toLowerCase() === word.word.toLowerCase();
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setCorrect(c => c + 1);
      setTimeout(next, 900);
    } else {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }), withTiming(0, { duration: 60 }),
      );
    }
  }, [input, result, word]);

  const next = useCallback(() => {
    if (index + 1 >= words.length) setFinished(true);
    else setIndex(i => i + 1);
  }, [index, words.length]);

  const handleRetry = () => { setIndex(0); setInput(''); setResult(null); setCorrect(0); setFinished(false); };

  if (finished) {
    const coins = correct * 10;
    return (
      <GameResult 
        correct={correct} 
        total={words.length} 
        coins={coins} 
        onDone={() => onFinish(coins)} 
        onRetry={handleRetry} 
      />
    );
  }

  const progress = (index + 1) / words.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.counter}>{index + 1} / {words.length}</Text>

        {/* Speaker button */}
        <View style={styles.speakerSection}>
          <TouchableOpacity
            style={[styles.speakerBtn, isSpeaking && styles.speakerBtnActive]}
            onPress={handlePlay}
            disabled={isSpeaking}
          >
            {isSpeaking
              ? <ActivityIndicator color="#fff" size="small" />
              : <FontAwesome name="volume-up" size={40} color="#fff" />}
          </TouchableOpacity>
          <Text style={styles.speakerHint}>
            {isSpeaking ? 'Đang phát...' : `Chạm để nghe${playCount > 0 ? ` (${playCount}x)` : ''}`}
          </Text>
          {/* Meaning hint */}
          <View style={styles.meaningHint}>
            <Text style={styles.meaningHintLabel}>Gợi ý nghĩa:</Text>
            <Text style={styles.meaningHintText}>{word.definition_vi || word.definition}</Text>
          </View>
        </View>

        {/* Input */}
        <Animated.View style={shakeStyle}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              result === 'correct' && styles.inputCorrect,
              result === 'wrong' && styles.inputWrong,
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Gõ từ bạn vừa nghe..."
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            editable={result === null}
          />
        </Animated.View>

        {result === 'wrong' && (
          <View style={styles.answerReveal}>
            <Text style={styles.answerLabel}>Đáp án: <Text style={styles.answerText}>{word.word}</Text></Text>
          </View>
        )}

        <View style={styles.actions}>
          {result === null ? (
            <TouchableOpacity
              style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!input.trim()}
            >
              <Text style={styles.submitBtnText}>Kiểm tra</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>{index + 1 >= words.length ? 'Kết thúc' : 'Tiếp →'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, gap: spacing.lg },
  progressBar: { height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#06B6D4', borderRadius: 3 },
  counter: { fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  speakerSection: { alignItems: 'center', gap: spacing.md },
  speakerBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  speakerBtnActive: { backgroundColor: '#0891B2' },
  speakerHint: { fontSize: 14, color: colors.textMuted },
  meaningHint: { backgroundColor: colors.surfaceContainerLow, padding: spacing.md, borderRadius: radius.lg, width: '100%', alignItems: 'center' },
  meaningHintLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  meaningHintText: { fontSize: 16, color: colors.text, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  input: { backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  inputCorrect: { borderColor: '#43A047', backgroundColor: '#E8F5E9' },
  inputWrong: { borderColor: '#EF5350', backgroundColor: '#FFEBEE' },
  answerReveal: { alignItems: 'center' },
  answerLabel: { fontSize: 15, color: colors.textSecondary },
  answerText: { fontWeight: '800', color: colors.primary },
  actions: { marginTop: 'auto' },
  submitBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: '#06B6D4' },
  submitBtnDisabled: { backgroundColor: colors.outlineVariant },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  nextBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.tertiary },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
