import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { WordMatch } from '@/components/vocabulary/WordMatch';
import { ScrambledLetters } from '@/components/vocabulary/ScrambledLetters';
import { ListenType } from '@/components/vocabulary/ListenType';
import { getPracticeWords, updateVaultWord } from '@/lib/offline/dictionary';
import { calculateNextReview } from '@/lib/offline/srs';
import { useGameStore } from '@/stores/useGameStore';
import { FontAwesome } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function PracticeScreen() {
  const { type } = useLocalSearchParams<{ type: 'match' | 'scramble' | 'listen_type' }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // For scramble/listen_type (one by one)
  const [finished, setFinished] = useState(false);

  const { score, xp, coins, startGame, endGame, addRewards, resetGame } = useGameStore();

  useEffect(() => {
    loadGameData();
    startGame(type as any);
    return () => resetGame();
  }, [type]);

  const syncRewards = async (finalXp: number, finalCoins: number) => {
    try {
      await api.post('/stats/rewards', { xp: finalXp, coins: finalCoins });
    } catch (error) {
      console.error('Failed to sync rewards:', error);
    }
  };

  const loadGameData = async () => {
    setLoading(true);
    try {
      const words = await getPracticeWords(type === 'match' ? 6 : 5);
      setData(words);
    } catch (error) {
      console.error('Load game data error:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu trò chơi');
    } finally {
      setLoading(false);
    }
  };

  const updateSRS = async (vocabId: number, isCorrect: boolean) => {
    const word = data.find(w => w.id === vocabId);
    if (!word) return;

    const stats = calculateNextReview(
      isCorrect ? 5 : 0, 
      word.interval || 0, 
      word.ease_factor || 2.5
    );
    await updateVaultWord(vocabId, stats);
  };

  const handleFinishMatch = async () => {
    // For simplicity in Match game, we update all words as correct if finished
    // because you can't "finish" without matching all.
    for (const word of data) {
      await updateSRS(word.id, true);
    }
    setFinished(true);
    addRewards(score * 2, Math.floor(score / 5));
    endGame();
  };

  const handleNextChallenge = async (isCorrect: boolean) => {
    await updateSRS(data[currentIndex].id, isCorrect);
    
    if (currentIndex + 1 < data.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      addRewards(score * 2, Math.floor(score / 5));
      endGame();
    }
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang chuẩn bị thử thách...</Text>
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen style={styles.finishedContainer}>
        <View style={styles.resultCard}>
          <FontAwesome name="trophy" size={80} color="#FDCB6E" />
          <Text style={styles.resultTitle}>Tuyệt vời!</Text>
          <Text style={styles.resultSubtitle}>Bạn đã hoàn thành thử thách</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ĐIỂM SỐ</Text>
              <Text style={styles.statValue}>{Math.floor(score)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>KINH NGHIỆM</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>+{Math.floor(xp)} XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>XU NHẬN ĐƯỢC</Text>
              <Text style={[styles.statValue, { color: '#F9CA24' }]}>+{coins}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.btnPrimary}
            onPress={() => router.back()}
          >
            <Text style={styles.btnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score:</Text>
          <Text style={styles.scoreValue}>{Math.floor(score)}</Text>
        </View>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {type === 'match' ? 'Matching' : 
             type === 'scramble' ? `Sắp xếp ${currentIndex + 1}/${data.length}` :
             `Nghe & Viết ${currentIndex + 1}/${data.length}`}
          </Text>
        </View>
      </View>

      <View style={styles.gameContent}>
        {type === 'match' ? (
          <WordMatch 
            data={data.map(item => ({ id: item.id, word: item.word, meaning: item.definition_vi }))} 
            onFinish={handleFinishMatch} 
          />
        ) : type === 'scramble' ? (
          <ScrambledLetters 
            word={data[currentIndex].word} 
            meaning={data[currentIndex].definition_vi} 
            onFinish={handleNextChallenge} 
          />
        ) : (
          <ListenType
            word={data[currentIndex].word}
            meaning={data[currentIndex].definition_vi}
            onFinish={handleNextChallenge}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: 16, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreLabel: { fontSize: 14, color: colors.outline, fontWeight: '600' },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  progressHeader: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  gameContent: { flex: 1 },
  finishedContainer: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.xl2,
    padding: spacing.xl,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  resultTitle: { fontSize: 32, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  resultSubtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.xl },
  statsRow: { flexDirection: 'row', width: '100%', gap: spacing.sm, marginBottom: spacing.xl2 },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  statLabel: { fontSize: 10, fontWeight: '800', color: colors.outline, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  btnPrimary: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
