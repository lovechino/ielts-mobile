/**
 * Matching Game (context-aware) — ghép từ với nghĩa từ lộ trình.
 * Tối đa 8 cặp mỗi round, tự động next round nếu còn từ.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { ContextWord } from '@/lib/offline/vocabContext';
import { GameResult } from './GameResult';
import { FontAwesome } from '@expo/vector-icons';

interface MatchingGameProps {
  words: ContextWord[];
  onFinish: (coins: number) => void;
}

const ROUND_SIZE = 6; // 6 cặp mỗi round

interface Card { id: string; label: string; pairId: number; type: 'word' | 'meaning' }
interface CardsState { left: Card[]; right: Card[] }

function buildCards(roundWords: ContextWord[]): CardsState {
  const left: Card[] = roundWords.map(w => ({
    id: `w-${w.id}`, label: w.word, pairId: w.id, type: 'word' as const,
  })).sort(() => Math.random() - 0.5);
  
  const right: Card[] = roundWords.map(w => ({
    id: `m-${w.id}`, label: w.definition_vi || w.definition || '', pairId: w.id, type: 'meaning' as const,
  })).sort(() => Math.random() - 0.5);
  
  return { left, right };
}

export function MatchingGame({ words, onFinish }: MatchingGameProps) {
  const totalRounds = Math.ceil(words.length / ROUND_SIZE);
  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<CardsState>({ left: [], right: [] });
  const [selected, setSelected] = useState<Card | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const roundWords = words.slice(round * ROUND_SIZE, (round + 1) * ROUND_SIZE);
  const totalWords = Math.min(words.length, totalRounds * ROUND_SIZE);

  useEffect(() => {
    setCards(buildCards(roundWords));
    setSelected(null);
    setMatched(new Set());
    setWrong([]);
  }, [round]);

  const handlePress = useCallback((card: Card) => {
    if (matched.has(card.pairId) || wrong.includes(card.id)) return;

    if (!selected) {
      setSelected(card);
      return;
    }

    if (selected.id === card.id) { setSelected(null); return; }

    if (selected.pairId === card.pairId && selected.type !== card.type) {
      // Correct match
      const newMatched = new Set(matched).add(card.pairId);
      setMatched(newMatched);
      setSelected(null);
      setTotalCorrect(c => c + 1);

      if (newMatched.size === roundWords.length) {
        // Round complete
        setTimeout(() => {
          if (round + 1 >= totalRounds) setFinished(true);
          else setRound(r => r + 1);
        }, 600);
      }
    } else {
      // Wrong
      setWrong([selected.id, card.id]);
      setTimeout(() => { setWrong([]); setSelected(null); }, 700);
    }
  }, [selected, matched, wrong, round, roundWords, totalRounds]);

  const renderCard = (card: Card) => {
    const isMatched = matched.has(card.pairId);
    const isSelected = selected?.id === card.id;
    const isWrong = wrong.includes(card.id);

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          card.type === 'word' && styles.cardWord,
          card.type === 'meaning' && styles.cardMeaning,
          isSelected && styles.cardSelected,
          isMatched && styles.cardMatched,
          isWrong && styles.cardWrong,
        ]}
        onPress={() => handlePress(card)}
        disabled={isMatched}
        activeOpacity={0.75}
      >
        <Text style={[
          styles.cardText,
          card.type === 'meaning' && styles.cardMeaningText,
          isMatched && styles.cardMatchedText,
        ]} numberOfLines={4}>
          {card.label}
        </Text>
        {isMatched && <FontAwesome name="check" size={12} color="#43A047" style={styles.checkIcon} />}
      </TouchableOpacity>
    );
  };

  const handleRetry = () => { setRound(0); setTotalCorrect(0); setFinished(false); };

  if (finished) {
    const coins = totalCorrect * 4;
    return (
      <GameResult 
        correct={totalCorrect} 
        total={totalWords} 
        coins={coins} 
        onDone={() => onFinish(coins)} 
        onRetry={handleRetry} 
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((round * ROUND_SIZE + matched.size) / totalWords) * 100}%` }]} />
      </View>
      <Text style={styles.counter}>
        Vòng {round + 1}/{totalRounds} · {matched.size}/{roundWords.length} cặp
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.columnsWrapper}>
          <View style={styles.column}>
            {cards.left.map(renderCard)}
          </View>
          <View style={styles.column}>
            {cards.right.map(renderCard)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  progressBar: { height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.xs },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },
  counter: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginBottom: spacing.md },
  scrollContent: { paddingBottom: spacing.xxl },
  columnsWrapper: { flexDirection: 'row', gap: spacing.md },
  column: { flex: 1, gap: spacing.sm },
  card: {
    width: '100%',
    minHeight: 72,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    position: 'relative',
  },
  cardWord: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  cardMeaning: { borderColor: colors.border, backgroundColor: '#fff' },
  cardSelected: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB', transform: [{ scale: 1.02 }] },
  cardMatched: { borderColor: '#43A047', backgroundColor: '#E8F5E9', opacity: 0.5 },
  cardWrong: { borderColor: '#EF5350', backgroundColor: '#FFEBEE' },
  cardText: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 20 },
  cardMeaningText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, lineHeight: 18 },
  cardMatchedText: { color: '#43A047' },
  checkIcon: { position: 'absolute', top: 4, right: 4 },
});
