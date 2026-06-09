import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useTTS } from '@/hooks/useTTS';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api/api';
import { GameResult } from '@/components/games/GameResult';

// Bộ 44 âm tiết IPA chuẩn, mỗi âm là một từ ví dụ DUY NHẤT
const ALL_SYMBOLS = [
  // Vowels
  { symbol: 'i:', word: 'sheep' }, { symbol: 'ɪ', word: 'ship' }, { symbol: 'ʊ', word: 'good' }, { symbol: 'u:', word: 'shoot' },
  { symbol: 'e', word: 'bed' }, { symbol: 'ə', word: 'teacher' }, { symbol: 'ɜ:', word: 'bird' }, { symbol: 'ɔ:', word: 'door' },
  { symbol: 'æ', word: 'cat' }, { symbol: 'ʌ', word: 'up' }, { symbol: 'ɑ:', word: 'far' }, { symbol: 'ɒ', word: 'on' },
  // Diphthongs
  { symbol: 'ɪə', word: 'ear' }, { symbol: 'eɪ', word: 'train' }, { symbol: 'ʊə', example: 'ure', word: 'pure' }, { symbol: 'ɔɪ', word: 'boy' },
  { symbol: 'əʊ', word: 'coat' }, { symbol: 'eə', word: 'air' }, { symbol: 'aɪ', word: 'eye' }, { symbol: 'aʊ', word: 'mouth' },
  // Consonants
  { symbol: 'p', word: 'pea' }, { symbol: 'b', word: 'boat' }, { symbol: 't', word: 'tea' }, { symbol: 'd', word: 'dog' },
  { symbol: 'tʃ', word: 'church' }, { symbol: 'dʒ', word: 'judge' }, { symbol: 'k', word: 'key' }, { symbol: 'g', word: 'go' },
  { symbol: 'f', word: 'fly' }, { symbol: 'v', word: 'video' }, { symbol: 'θ', word: 'thin' }, { symbol: 'ð', word: 'this' },
  { symbol: 's', word: 'sea' }, { symbol: 'z', word: 'zoo' }, { symbol: 'ʃ', word: 'shoe' }, { symbol: 'ʒ', word: 'television' },
  { symbol: 'm', word: 'man' }, { symbol: 'n', word: 'now' }, { symbol: 'ŋ', word: 'sing' }, { symbol: 'h', word: 'hat' },
  { symbol: 'l', word: 'love' }, { symbol: 'r', word: 'red' }, { symbol: 'w', word: 'wet' }, { symbol: 'j', word: 'yes' },
];

const QUESTIONS_PER_ROUND = 10;

export default function IPAGameScreen() {
  const router = useRouter();
  const { speak } = useTTS();
  const { refreshUser } = useAuthStore();
  const [question, setQuestion] = useState<{ target: any, options: any[] } | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [shakeAnim] = useState(new Animated.Value(0));
  
  const lastTargetRef = useRef<string | null>(null);

  const generateQuestion = useCallback((currentTotal: number) => {
    if (currentTotal >= QUESTIONS_PER_ROUND) {
      setFinished(true);
      return;
    }

    // Chọn target không trùng với câu ngay trước đó
    let target: typeof ALL_SYMBOLS[0];
    do {
      target = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    } while (target.symbol === lastTargetRef.current);
    
    lastTargetRef.current = target.symbol;

    let options = [target];
    while (options.length < 4) {
      const random = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
      if (!options.find(o => o.symbol === random.symbol)) {
        options.push(random);
      }
    }

    setQuestion({
      target,
      options: options.sort(() => Math.random() - 0.5)
    });
    setAnswered(false);
    setSelectedIdx(null);
    setTimeout(() => speak(target.word), 500);
  }, [speak]);

  useEffect(() => {
    generateQuestion(0);
  }, []);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedIdx(idx);
    setAnswered(true);
    
    const isCorrect = question?.options[idx].symbol === question?.target.symbol;
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      const nextTotal = total + 1;
      setTotal(nextTotal);
      generateQuestion(nextTotal);
    }, isCorrect ? 1000 : 1500);
  };

  const onFinish = async (coins: number) => {
    if (coins > 0) {
      try {
        await api.post('/stats/rewards', { xp: 0, coins });
        await refreshUser();
      } catch (e) {
        console.error('[IPA Game] Reward sync failed:', e);
      }
    }
    router.back();
  };

  const handleRetry = () => {
    setScore(0);
    setTotal(0);
    setFinished(false);
    lastTargetRef.current = null;
    generateQuestion(0);
  };

  if (finished) {
    const coins = score * 2;
    return (
      <GameResult 
        correct={score} 
        total={QUESTIONS_PER_ROUND} 
        coins={coins} 
        onDone={() => onFinish(coins)} 
        onRetry={handleRetry} 
      />
    );
  }

  if (!question) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="times" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressHeader}>
          <Text style={styles.scoreText}>Câu {total + 1}/{QUESTIONS_PER_ROUND}</Text>
          <Text style={styles.pointText}>Đúng: {score}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Nghe và chọn ký hiệu IPA đúng:</Text>
        
        <TouchableOpacity 
          style={styles.speakerBtn} 
          onPress={() => speak(question.target.word)}
        >
          <FontAwesome name="volume-up" size={48} color={colors.primary} />
          <Text style={styles.speakerHint}>Nghe lại ví dụ</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.optionsGrid, { transform: [{ translateX: shakeAnim }] }]}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = opt.symbol === question.target.symbol;
            
            let cardStyle: any = [styles.optionCard];
            let textStyle: any = [styles.optionText];

            if (answered) {
              if (isCorrect) cardStyle.push(styles.cardCorrect);
              else if (isSelected) cardStyle.push(styles.cardWrong);
            } else if (isSelected) {
              cardStyle.push(styles.cardSelected);
            }

            return (
              <TouchableOpacity
                key={idx}
                style={cardStyle}
                onPress={() => handleSelect(idx)}
                activeOpacity={0.7}
              >
                <Text style={textStyle}>{opt.symbol}</Text>
                {answered && isCorrect && <View style={styles.badge}><FontAwesome name="check" size={12} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressHeader: { alignItems: 'center' },
  scoreText: { fontSize: 16, fontWeight: '700', color: colors.text },
  pointText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl },
  instruction: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.xxl, textAlign: 'center' },
  speakerBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
    marginBottom: 60,
    borderWidth: 4,
    borderColor: colors.primaryFixed,
  },
  speakerHint: { fontSize: 12, color: colors.primary, marginTop: 8, fontWeight: '600' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  optionCard: {
    width: '45%',
    height: 100,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.sm,
  },
  optionText: { fontSize: 32, fontWeight: '700', color: colors.text },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  cardCorrect: { borderColor: '#43A047', backgroundColor: '#E8F5E9' },
  cardWrong: { borderColor: '#EF5350', backgroundColor: '#FFEBEE' },
  badge: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#43A047', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
});
