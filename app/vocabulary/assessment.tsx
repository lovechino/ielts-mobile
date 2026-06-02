import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { getRandomWords } from '@/lib/offline/dictionary';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TestWord {
  id: number;
  word: string;
  definition_vi: string;
  level: string; // A1, A2, B1, B2, C1, C2
}

export default function AssessmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<TestWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    loadTestWords();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      generateOptions();
    }
  }, [currentIndex, questions]);

  const loadTestWords = async () => {
    setLoading(true);
    try {
      // Bốc 15 từ đại diện cho các level (3 từ mỗi level)
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
      let allWords: any[] = [];
      
      // Giả lập bốc từ theo level (sau này sẽ dùng query SQL thực tế)
      const rawWords = await getRandomWords(40); 
      setQuestions(rawWords.slice(0, 15));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptions = () => {
    const current = questions[currentIndex];
    const others = questions
      .filter(q => q.id !== current.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(q => q.definition_vi);
    
    setOptions([current.definition_vi, ...others].sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (answer: string) => {
    if (answer === questions[currentIndex].definition_vi) {
      setCorrectCount(prev => prev + 1);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const getEstimatedLevel = () => {
    const score = (correctCount / questions.length) * 10;
    if (score < 3) return { level: 'Cơ bản', band: '3.0 - 4.0', vocab: '~1,000' };
    if (score < 6) return { level: 'Trung cấp', band: '4.5 - 5.5', vocab: '~2,500' };
    if (score < 8) return { level: 'Khá', band: '6.0 - 7.0', vocab: '~5,000' };
    return { level: 'Nâng cao', band: '7.5+', vocab: '8,000+' };
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang chuẩn bị bài đánh giá...</Text>
      </Screen>
    );
  }

  if (finished) {
    const result = getEstimatedLevel();
    return (
      <Screen style={styles.resultContainer}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <FontAwesome name="line-chart" size={40} color={colors.primary} />
            <Text style={styles.resultLabel}>KẾT QUẢ ĐÁNH GIÁ</Text>
          </View>
          
          <Text style={styles.levelTitle}>{result.level}</Text>
          <Text style={styles.bandText}>IELTS tương đương: {result.band}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{correctCount}/15</Text>
              <Text style={styles.statLab}>Chính xác</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.vocab}</Text>
              <Text style={styles.statLab}>Vốn từ ước tính</Text>
            </View>
          </View>

          <Text style={styles.recommendText}>
            Dựa trên kết quả này, chúng tôi đã chuẩn bị lộ trình từ vựng riêng cho bạn.
          </Text>

          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => router.push('/vocabulary/recommendations')}
          >
            <Text style={styles.primaryBtnText}>Xem lộ trình đề xuất</Text>
            <FontAwesome name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </Screen>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Guard: nếu không có câu hỏi (DB rỗng), chuyển thẳng sang kết quả
  if (!currentQuestion) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      <Animated.View key={currentIndex} entering={SlideInRight} style={styles.quizContent}>
        <Text style={styles.questionLabel}>Từ này có nghĩa là gì?</Text>
        <Text style={styles.wordText}>{currentQuestion.word}</Text>
        
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.optionBtn}
              onPress={() => handleAnswer(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <TouchableOpacity style={styles.skipBtn} onPress={() => setFinished(true)}>
        <Text style={styles.skipText}>Bỏ qua đánh giá</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: 16, color: colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl2 },
  progressBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressText: { fontSize: 14, fontWeight: '700', color: colors.outline, width: 50 },
  
  quizContent: { flex: 1, gap: spacing.lg },
  questionLabel: { fontSize: 16, color: colors.outline, fontWeight: '600' },
  wordText: { fontSize: 42, fontWeight: '800', color: colors.text, marginBottom: spacing.xl },
  optionsContainer: { gap: spacing.md },
  optionBtn: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  optionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  
  skipBtn: { marginTop: 'auto', alignItems: 'center', padding: spacing.md },
  skipText: { color: colors.outline, fontSize: 14, textDecorationLine: 'underline' },

  resultContainer: { padding: spacing.xl, justifyContent: 'center' },
  resultCard: {
    backgroundColor: '#fff',
    padding: spacing.xl,
    borderRadius: radius.xl2,
    alignItems: 'center',
    gap: spacing.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  resultHeader: { alignItems: 'center', gap: 8 },
  resultLabel: { fontSize: 12, fontWeight: '800', color: colors.outline, letterSpacing: 2 },
  levelTitle: { fontSize: 36, fontWeight: '900', color: colors.text },
  bandText: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginVertical: spacing.md },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLab: { fontSize: 12, color: colors.outline },
  divider: { width: 1, backgroundColor: colors.border },
  recommendText: { textAlign: 'center', color: colors.textSecondary, lineHeight: 22 },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
