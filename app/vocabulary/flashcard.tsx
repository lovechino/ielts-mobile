/**
 * Flashcard Game — lật thẻ với hiệu ứng 3D (react-native-reanimated).
 * Route: /vocabulary/flashcard
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
  interpolate, Extrapolate, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { getPracticeWords, updateVaultWord } from '@/lib/offline/dictionary';
import { calculateNextReview } from '@/lib/offline/srs';
import { useGameStore } from '@/stores/useGameStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTTS } from '@/hooks/useTTS';
import { api } from '@/lib/api/api';

const { width } = Dimensions.get('window');
const CARD_W = width - spacing.xl * 2;
const CARD_H = 380;
const TOTAL_CARDS = 8;

interface CardWord {
  id: number;
  word: string;
  pronunciation?: string;
  definition: string;
  definition_vi: string;
  example?: string;
  example_vi?: string;
  interval?: number;
  ease_factor?: number;
}

// ─── Single Flashcard with 3D flip ──────────────────────────────────────────

interface FlipCardProps {
  card: CardWord;
  onRate: (rating: 'easy' | 'hard' | 'again') => void;
}

function FlipCard({ card, onRate }: FlipCardProps) {
  const spin = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  const { speak } = useTTS();

  // Reset flip when card changes
  useEffect(() => {
    spin.value = withTiming(0, { duration: 0 });
    setFlipped(false);
    // Auto-play TTS on new card
    setTimeout(() => speak(card.word), 300);
  }, [card.id]);

  const handleFlip = () => {
    const target = flipped ? 0 : 180;
    spin.value = withSpring(target, { damping: 14, stiffness: 180 });
    setFlipped(!flipped);
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(spin.value, [0, 180], [0, 180], Extrapolate.CLAMP);
    return {
      transform: [{ rotateY: `${rotate}deg` }],
      zIndex: spin.value < 90 ? 2 : 0,
      opacity: spin.value < 90 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(spin.value, [0, 180], [180, 360], Extrapolate.CLAMP);
    return {
      transform: [{ rotateY: `${rotate}deg` }],
      zIndex: spin.value >= 90 ? 2 : 0,
      opacity: spin.value >= 90 ? 1 : 0,
    };
  });

  return (
    <View style={styles.cardArea}>
      <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
          <Text style={styles.wordText}>{card.word}</Text>
          {card.pronunciation ? (
            <Text style={styles.ipaText}>/{card.pronunciation}/</Text>
          ) : null}
          <TouchableOpacity
            style={styles.ttsBtn}
            onPress={(e) => { e.stopPropagation?.(); speak(card.word); }}
          >
            <FontAwesome name="volume-up" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.flipHint}>
            <FontAwesome name="refresh" size={12} color={colors.outline} />
            <Text style={styles.flipHintText}>Chạm để xem nghĩa</Text>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <View style={styles.backContent}>
            <Text style={styles.defLabel}>ĐỊNH NGHĨA</Text>
            <Text style={styles.defEn}>{card.definition}</Text>
            <Text style={styles.defVi}>{card.definition_vi}</Text>

            {card.example ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.defLabel}>VÍ DỤ</Text>
                <Text style={styles.exEn}>"{card.example}"</Text>
                {card.example_vi ? (
                  <Text style={styles.exVi}>{card.example_vi}</Text>
                ) : null}
              </>
            ) : null}
          </View>
          <View style={styles.flipHint}>
            <Text style={styles.flipHintText}>Chạm để quay lại</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Rating buttons — chỉ hiện khi đã lật */}
      {flipped && (
        <View style={styles.ratingRow}>
          <TouchableOpacity
            style={[styles.ratingBtn, styles.ratingAgain]}
            onPress={() => onRate('again')}
          >
            <FontAwesome name="times" size={16} color="#fff" />
            <Text style={styles.ratingText}>Lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, styles.ratingHard]}
            onPress={() => onRate('hard')}
          >
            <FontAwesome name="minus" size={16} color="#fff" />
            <Text style={styles.ratingText}>Khó</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, styles.ratingEasy]}
            onPress={() => onRate('easy')}
          >
            <FontAwesome name="check" size={16} color="#fff" />
            <Text style={styles.ratingText}>Dễ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function FlashcardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardWord[]>([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [easyCount, setEasyCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);

  const { score, coins, startGame, endGame, addRewards, addScore, incrementCombo, resetCombo, resetGame } = useGameStore();
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    loadCards();
    startGame('flashcard');
    return () => resetGame();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const words = await getPracticeWords(TOTAL_CARDS);
      setCards(words as CardWord[]);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu flashcard');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = useCallback(async (rating: 'easy' | 'hard' | 'again') => {
    const card = cards[index];
    if (!card) return;

    // SRS update
    const quality = rating === 'easy' ? 5 : rating === 'hard' ? 2 : 0;
    const stats = calculateNextReview(quality, card.interval || 0, card.ease_factor || 2.5);
    await updateVaultWord(card.id, stats);

    // Score
    if (rating === 'easy') {
      addScore(20);
      incrementCombo();
      setEasyCount((c) => c + 1);
    } else if (rating === 'hard') {
      addScore(8);
      setHardCount((c) => c + 1);
    } else {
      resetCombo();
      setHardCount((c) => c + 1);
    }

    if (index + 1 >= cards.length) {
      const finalCoins = Math.round(score / 2);
      addRewards(finalCoins);
      endGame();
      
      // Sync to server and refresh user state
      (async () => {
        try { 
          await api.post('/stats/rewards', { xp: 0, coins: finalCoins }); 
          await refreshUser();
        } catch (e) {
          console.error('[Flashcard] Sync failed:', e);
        }
      })();

      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }, [cards, index, score]);

  // ── Loading ──
  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang chuẩn bị thẻ...</Text>
        </View>
      </Screen>
    );
  }

  // ── Finished ──
  if (finished) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.resultCard}>
            <FontAwesome name="star" size={72} color="#FDCB6E" />
            <Text style={styles.resultTitle}>Hoàn thành!</Text>
            <Text style={styles.resultSub}>{cards.length} thẻ đã ôn tập</Text>

            <View style={[styles.statBox, { backgroundColor: '#F9CA2420', borderWidth: 1, borderColor: '#F9CA24', width: '100%', marginBottom: spacing.md }]}>
                <Text style={[styles.statLbl, { color: '#B7950B' }]}>XU NHẬN ĐƯỢC</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome name="database" size={18} color="#F9CA24" />
                  <Text style={[styles.statVal, { fontSize: 22, color: '#B7950B' }]}>+{coins}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{easyCount}</Text>
                <Text style={styles.statLbl}>Dễ ✓</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{hardCount}</Text>
                <Text style={styles.statLbl}>Khó / Lại</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>Tiếp tục</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={() => {
              setFinished(false);
              setIndex(0);
              setEasyCount(0);
              setHardCount(0);
              loadCards();
              startGame('flashcard');
            }}>
              <Text style={styles.retryBtnText}>Ôn tập lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Screen>
    );
  }

  const card = cards[index];
  const progress = ((index) / cards.length) * 100;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <FontAwesome name="times" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.counterText}>{index + 1}/{cards.length}</Text>
      </View>

      {/* Score strip */}
      <View style={styles.scoreStrip}>
        <View style={styles.scoreItem}>
          <FontAwesome name="database" size={13} color="#FDCB6E" />
          <Text style={styles.scoreVal}>{Math.floor(score)}</Text>
        </View>
        <View style={styles.scoreItem}>
          <FontAwesome name="fire" size={13} color={colors.secondary} />
          <Text style={styles.scoreVal}>{useGameStore.getState().combo}x</Text>
        </View>
      </View>

      {/* Card */}
      {card && <FlipCard key={card.id} card={card} onRate={handleRate} />}
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: 15, color: colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  counterText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, minWidth: 36, textAlign: 'right' },

  scoreStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xs,
  },
  scoreItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreVal: { fontSize: 14, fontWeight: '700', color: colors.text },

  // Card
  cardArea: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  cardWrapper: { width: CARD_W, height: CARD_H },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius.xl2,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardFront: {
    backgroundColor: '#fff',
    gap: spacing.md,
  },
  cardBack: {
    backgroundColor: '#F8F9FE',
  },
  wordText: { fontSize: 44, fontWeight: '800', color: colors.text, textAlign: 'center' },
  ipaText: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  ttsBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  flipHint: {
    position: 'absolute',
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipHintText: { fontSize: 12, color: colors.outline },

  backContent: { width: '100%', gap: spacing.sm },
  defLabel: { fontSize: 11, fontWeight: '800', color: colors.outline, letterSpacing: 0.8, textTransform: 'uppercase' },
  defEn: { fontSize: 17, fontWeight: '600', color: colors.text, lineHeight: 25 },
  defVi: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  exEn: { fontSize: 14, color: colors.text, fontStyle: 'italic', lineHeight: 21 },
  exVi: { fontSize: 13, color: colors.textMuted },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: CARD_W,
  },
  ratingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  ratingAgain: { backgroundColor: '#EF5350' },
  ratingHard: { backgroundColor: colors.secondary },
  ratingEasy: { backgroundColor: colors.tertiary },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Result
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.xl2,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  resultTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  resultSub: { fontSize: 15, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', width: '100%', gap: spacing.sm, marginVertical: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: 4,
  },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  doneBtn: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  retryBtn: {
    width: '100%',
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
