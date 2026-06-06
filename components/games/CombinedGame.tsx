/**
 * Combined Game — chạy tuần tự: Flashcard → Quiz → Typing.
 * Mỗi phase dùng subset của words.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { ContextWord } from '@/lib/offline/vocabContext';
import { FlashcardContextGame } from './FlashcardContextGame';
import { QuizGame } from './QuizGame';
import { TypingGame } from './TypingGame';
import { GameResult } from './GameResult';

type Phase = 'intro' | 'flashcard' | 'quiz' | 'typing' | 'done';

interface CombinedGameProps {
  words: ContextWord[];
  onFinish: (coins: number) => void;
}

const PHASES: Phase[] = ['flashcard', 'quiz', 'typing'];
const PHASE_LABELS: Record<Phase, string> = {
  intro: 'Chuẩn bị',
  flashcard: '1. Flashcard',
  quiz: '2. Quiz',
  typing: '3. Typing',
  done: 'Hoàn thành',
};
const PHASE_COLORS: Record<Phase, string> = {
  intro: colors.primary, flashcard: '#6366F1', quiz: '#F97316', typing: '#65A30D', done: '#43A047',
};

export function CombinedGame({ words, onFinish }: CombinedGameProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Phân chia từ: flashcard lấy tất cả, quiz và typing lấy subset
  const flashcardWords = words;
  const quizWords = words.slice(0, Math.min(words.length, 15));
  const typingWords = words.slice(0, Math.min(words.length, 10));

  const currentPhase = PHASES[phaseIndex] ?? 'done';

  const handlePhaseFinish = (coins?: number) => {
    if (phaseIndex + 1 >= PHASES.length) {
      setPhaseIndex(PHASES.length); // done
    } else {
      setPhaseIndex(i => i + 1);
    }
  };

  // Done
  if (phaseIndex >= PHASES.length) {
    const coins = words.length * 12;
    return (
      <GameResult
        correct={Math.round(words.length * 0.8)} // Tổng hợp — đây là estimate
        total={words.length}
        coins={coins}
        onDone={() => onFinish(coins)}
        onRetry={() => setPhaseIndex(0)}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Phase indicator */}
      <View style={styles.phaseBar}>
        {PHASES.map((p, i) => (
          <View
            key={p}
            style={[
              styles.phaseDot,
              { backgroundColor: i <= phaseIndex ? PHASE_COLORS[p] : colors.outlineVariant },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.phaseLabel, { color: PHASE_COLORS[currentPhase] }]}>
        {PHASE_LABELS[currentPhase]}
      </Text>

      {currentPhase === 'flashcard' && (
        <FlashcardContextGame words={flashcardWords} onFinish={handlePhaseFinish} />
      )}
      {currentPhase === 'quiz' && (
        <QuizGame words={quizWords} onFinish={handlePhaseFinish} />
      )}
      {currentPhase === 'typing' && (
        <TypingGame words={typingWords} onFinish={handlePhaseFinish} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  phaseBar: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  phaseDot: { width: 32, height: 6, borderRadius: 3 },
  phaseLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: spacing.xs },
});
