/**
 * Typing Game — xem nghĩa tiếng Việt, gõ từ tiếng Anh đúng.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming, withRepeat, useAnimatedStyle } from 'react-native-reanimated';
import { colors, spacing, radius } from '@/theme/tokens';
import { ContextWord } from '@/lib/offline/vocabContext';
import { GameResult } from './GameResult';
import { useTTS } from '@/hooks/useTTS';
import { FontAwesome } from '@expo/vector-icons';

interface TypingGameProps {
  words: ContextWord[];
  onFinish: (coins: number) => void;
}

export function TypingGame({ words, onFinish }: TypingGameProps) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hint, setHint] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { speak } = useTTS();

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const word = words[index];

  useEffect(() => {
    setInput('');
    setResult(null);
    setHint(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [index]);

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
    const coins = correct * 8;
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
        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.counter}>{index + 1} / {words.length}</Text>

        {/* Meaning card */}
        <View style={styles.meaningCard}>
          <Text style={styles.meaningLabel}>Gõ từ tiếng Anh có nghĩa:</Text>
          <Text style={styles.meaningText}>{word.definition_vi || word.definition}</Text>
          {word.example_vi ? <Text style={styles.exampleText}>"{word.example_vi}"</Text> : null}
          {/* Hint: show first letter */}
          {hint && (
            <View style={styles.hintRow}>
              <Text style={styles.hintLabel}>Gợi ý:</Text>
              <Text style={styles.hintText}>
                {word.word[0].toUpperCase() + '_'.repeat(word.word.length - 1)}
                {word.word.length > 4 ? ` (${word.word.length} ký tự)` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Input */}
        <Animated.View style={[styles.inputWrap, shakeStyle]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              result === 'correct' && styles.inputCorrect,
              result === 'wrong' && styles.inputWrong,
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Nhập từ tiếng Anh..."
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            editable={result === null}
            returnKeyType="done"
          />
        </Animated.View>

        {/* Wrong: show answer */}
        {result === 'wrong' && (
          <View style={styles.answerReveal}>
            <Text style={styles.answerLabel}>Đáp án đúng:</Text>
            <TouchableOpacity onPress={() => speak(word.word)} style={styles.answerRow}>
              <Text style={styles.answerText}>{word.word}</Text>
              <FontAwesome name="volume-up" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!hint && result === null && (
            <TouchableOpacity style={styles.hintBtn} onPress={() => setHint(true)}>
              <FontAwesome name="lightbulb-o" size={14} color="#F0932B" />
              <Text style={styles.hintBtnText}>Gợi ý</Text>
            </TouchableOpacity>
          )}
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
              <Text style={styles.nextBtnText}>
                {index + 1 >= words.length ? 'Kết thúc' : 'Tiếp theo →'}
              </Text>
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
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  counter: { fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  meaningCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.primary },
  meaningLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  meaningText: { fontSize: 20, fontWeight: '700', color: colors.text, lineHeight: 28 },
  exampleText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  hintLabel: { fontSize: 12, color: '#F0932B', fontWeight: '700' },
  hintText: { fontSize: 14, color: '#F0932B', fontWeight: '600', fontFamily: 'monospace' },
  inputWrap: {},
  input: { backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  inputCorrect: { borderColor: '#43A047', backgroundColor: '#E8F5E9' },
  inputWrong: { borderColor: '#EF5350', backgroundColor: '#FFEBEE' },
  answerReveal: { alignItems: 'center', gap: spacing.xs },
  answerLabel: { fontSize: 12, color: colors.textMuted },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  answerText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 'auto' },
  hintBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: '#FFF3E0' },
  hintBtnText: { fontSize: 13, fontWeight: '700', color: '#F0932B' },
  submitBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primary },
  submitBtnDisabled: { backgroundColor: colors.outlineVariant },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  nextBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.tertiary },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
