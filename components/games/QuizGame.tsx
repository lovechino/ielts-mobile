/**
 * Quiz Game — trắc nghiệm 4 đáp án, từ vựng từ context của lộ trình.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { colors, spacing, radius } from '@/theme/tokens';
import { ContextWord } from '@/lib/offline/vocabContext';
import { GameResult } from './GameResult';
import { useTTS } from '@/hooks/useTTS';
import { FontAwesome } from '@expo/vector-icons';

interface QuizGameProps {
  words: ContextWord[];
  onFinish: (coins: number) => void;
}

interface Question {
  word: ContextWord;
  options: string[]; // 4 definition_vi options
  correctIndex: number;
}

function buildQuestions(words: ContextWord[]): Question[] {
  return words.map((w, i) => {
    const correct = w.definition_vi || w.definition || '';
    // Distractors: pick 3 other words' definitions
    const others = words
      .filter((_, j) => j !== i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(o => o.definition_vi || o.definition || '');

    const options = [...others, correct].sort(() => Math.random() - 0.5);
    return { word: w, options, correctIndex: options.indexOf(correct) };
  });
}

export function QuizGame({ words, onFinish }: QuizGameProps) {
  const [questions] = useState<Question[]>(() => buildQuestions(words));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const { speak } = useTTS();

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const handleSelect = useCallback((optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const q = questions[index];
    if (optIdx === q.correctIndex) {
      setCorrect(c => c + 1);
    } else {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) setFinished(true);
      else { setIndex(i => i + 1); setSelected(null); }
    }, 900);
  }, [selected, index, questions]);

  const handleRetry = useCallback(() => {
    setIndex(0); setSelected(null); setCorrect(0); setFinished(false);
  }, []);

  if (finished) {
    const coins = correct * 5;
    return (
      <GameResult 
        correct={correct} 
        total={questions.length} 
        coins={coins} 
        onDone={() => onFinish(coins)} 
        onRetry={handleRetry} 
      />
    );
  }

  const q = questions[index];
  const progress = (index + 1) / questions.length;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.counter}>{index + 1} / {questions.length}</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Word card */}
        <Animated.View style={[styles.wordCard, shakeStyle]}>
          <View style={styles.wordRow}>
            <Text style={styles.wordText}>{q.word.word}</Text>
            <TouchableOpacity onPress={() => speak(q.word.word)} style={styles.ttsBtn}>
              <FontAwesome name="volume-up" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {q.word.pronunciation ? <Text style={styles.ipa}>/{q.word.pronunciation}/</Text> : null}
          <Text style={styles.questionLabel}>Chọn nghĩa đúng:</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.options}>
          {q.options.map((opt, i) => {
            let bg: string = '#fff';
            let border: string = colors.border;
            if (selected !== null) {
              if (i === q.correctIndex) { bg = '#E8F5E9'; border = '#43A047'; }
              else if (i === selected) { bg = '#FFEBEE'; border = '#EF5350'; }
            }
            return (
              <TouchableOpacity
                key={i}
                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleSelect(i)}
                disabled={selected !== null}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLetter}>{['A', 'B', 'C', 'D'][i]}</Text>
                <Text style={styles.optionText}>{opt}</Text>
                {selected !== null && i === q.correctIndex && (
                  <FontAwesome name="check-circle" size={18} color="#43A047" />
                )}
                {selected === i && i !== q.correctIndex && (
                  <FontAwesome name="times-circle" size={18} color="#EF5350" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { height: 6, backgroundColor: colors.surfaceContainerHigh, marginHorizontal: spacing.md, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  counter: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginRight: spacing.md, marginTop: spacing.xs },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  wordCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wordText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  ttsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  ipa: { fontSize: 15, color: colors.textSecondary },
  questionLabel: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  options: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  optionLetter: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  optionText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500', lineHeight: 22 },
});
