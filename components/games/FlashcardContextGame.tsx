/**
 * Flashcard Game (context-aware) — dùng từ của lộ trình, không phải getPracticeWords().
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, interpolate, Extrapolate, withTiming } from 'react-native-reanimated';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { ContextWord } from '@/lib/offline/vocabContext';
import { GameResult } from './GameResult';
import { useTTS } from '@/hooks/useTTS';
import { updateVaultWord } from '@/lib/offline/dictionary';
import { calculateNextReview } from '@/lib/offline/srs';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_W = width - spacing.xl * 2;
const CARD_H = 320;

interface FlashcardContextGameProps {
  words: ContextWord[];
  onFinish: () => void;
}

function FlipCard({ card, onRate }: { card: ContextWord; onRate: (r: 'easy' | 'hard' | 'again') => void }) {
  const spin = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  const { speak } = useTTS();

  useEffect(() => {
    spin.value = withTiming(0, { duration: 0 });
    setFlipped(false);
    setTimeout(() => speak(card.word), 300);
  }, [card.id]);

  const handleFlip = () => {
    spin.value = withSpring(flipped ? 0 : 180, { damping: 14, stiffness: 180 });
    setFlipped(!flipped);
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(spin.value, [0, 180], [0, 180], Extrapolate.CLAMP)}deg` }],
    zIndex: spin.value < 90 ? 2 : 0,
    opacity: spin.value < 90 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(spin.value, [0, 180], [180, 360], Extrapolate.CLAMP)}deg` }],
    zIndex: spin.value >= 90 ? 2 : 0,
    opacity: spin.value >= 90 ? 1 : 0,
  }));

  return (
    <View style={styles.cardArea}>
      <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
          <Text style={styles.wordText}>{card.word}</Text>
          {card.pronunciation ? <Text style={styles.ipaText}>/{card.pronunciation}/</Text> : null}
          <TouchableOpacity style={styles.ttsBtn} onPress={e => { e.stopPropagation?.(); speak(card.word); }}>
            <FontAwesome name="volume-up" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.flipHint}>Chạm để xem nghĩa</Text>
        </Animated.View>
        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <Text style={styles.defLabel}>ĐỊNH NGHĨA</Text>
          <Text style={styles.defVi}>{card.definition_vi || card.definition}</Text>
          {card.example ? <><Text style={[styles.defLabel, { marginTop: spacing.sm }]}>VÍ DỤ</Text>
            <Text style={styles.exText}>"{card.example}"</Text></> : null}
          <Text style={styles.flipHint}>Chạm để quay lại</Text>
        </Animated.View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.ratingRow}>
          <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#EF5350' }]} onPress={() => onRate('again')}>
            <FontAwesome name="times" size={14} color="#fff" />
            <Text style={styles.ratingText}>Lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#F0932B' }]} onPress={() => onRate('hard')}>
            <FontAwesome name="minus" size={14} color="#fff" />
            <Text style={styles.ratingText}>Khó</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#43A047' }]} onPress={() => onRate('easy')}>
            <FontAwesome name="check" size={14} color="#fff" />
            <Text style={styles.ratingText}>Dễ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function FlashcardContextGame({ words, onFinish }: FlashcardContextGameProps) {
  const [index, setIndex] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleRate = useCallback(async (rating: 'easy' | 'hard' | 'again') => {
    const card = words[index];
    const quality = rating === 'easy' ? 5 : rating === 'hard' ? 2 : 0;
    const stats = calculateNextReview(quality, 0, 2.5);
    try { await updateVaultWord(card.id, stats); } catch {}
    if (rating === 'easy') setEasyCount(c => c + 1);
    if (index + 1 >= words.length) setFinished(true);
    else setIndex(i => i + 1);
  }, [index, words]);

  const handleRetry = () => { setIndex(0); setEasyCount(0); setFinished(false); };

  if (finished) return <GameResult correct={easyCount} total={words.length} xp={easyCount * 6} onDone={onFinish} onRetry={handleRetry} />;

  const progress = (index + 1) / words.length;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.counter}>{index + 1} / {words.length}</Text>
      <FlipCard key={words[index].id} card={words[index]} onRate={handleRate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  progressBar: { height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.xs },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
  counter: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginBottom: spacing.sm },
  cardArea: { flex: 1, alignItems: 'center' },
  cardWrapper: { width: CARD_W, height: CARD_H },
  card: { position: 'absolute', width: '100%', height: '100%', borderRadius: radius.xl2, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadow.card, gap: spacing.sm },
  cardFront: { backgroundColor: '#fff' },
  cardBack: { backgroundColor: '#F8F9FE' },
  wordText: { fontSize: 36, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  ipaText: { fontSize: 16, color: colors.textSecondary },
  ttsBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  flipHint: { position: 'absolute', bottom: spacing.md, fontSize: 12, color: colors.outline },
  defLabel: { fontSize: 10, fontWeight: '800', color: colors.outline, letterSpacing: 0.8, textTransform: 'uppercase', alignSelf: 'flex-start' },
  defVi: { fontSize: 18, color: colors.text, fontWeight: '600', lineHeight: 26, textAlign: 'center' },
  exText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  ratingRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, width: CARD_W },
  ratingBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, borderRadius: radius.lg },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
