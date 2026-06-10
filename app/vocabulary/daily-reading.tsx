import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useDailyStore } from '@/stores/useDailyStore';

export default function DailyReadingScreen() {
  const router = useRouter();
  const { challengeData } = useLocalSearchParams<{ challengeData: string }>();
  const completeTask = useDailyStore(state => state.completeTask);
  
  const challenge = JSON.parse(challengeData || '{}');
  const reading = challenge.content?.reading;

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  if (!reading) {
    return (
      <Screen style={styles.centered}>
        <Text>Không tìm thấy dữ liệu bài đọc.</Text>
      </Screen>
    );
  }

  const handleSelectOption = (qIdx: number, option: string) => {
    if (showResults) return;
    const optionLetter = option.substring(0, 1); // Get "A", "B", etc.
    setAnswers({ ...answers, [qIdx]: optionLetter });
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < reading.questions.length) {
      Alert.alert('Chưa hoàn thành', 'Vui lòng trả lời hết tất cả câu hỏi.');
      return;
    }
    setShowResults(true);
    // Mark task as completed in the store
    completeTask('daily-reading');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Reading</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeIn} style={styles.passageCard}>
          <Text style={styles.passageTitle}>{reading.title}</Text>
          <Text style={styles.passageText}>{reading.text}</Text>
        </Animated.View>

        <Text style={styles.sectionTitle}>Câu hỏi hiểu bài</Text>

        {reading.questions.map((q: any, qIdx: number) => {
          const isCorrect = answers[qIdx] === q.answer;
          return (
            <View key={qIdx} style={styles.questionCard}>
              <Text style={styles.questionText}>
                {qIdx + 1}. {q.q}
              </Text>
              <View style={styles.optionsList}>
                {q.options.map((opt: string, optIdx: number) => {
                  const letter = opt.substring(0, 1);
                  const isSelected = answers[qIdx] === letter;
                  const isCorrectOption = letter === q.answer;

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[
                        styles.optionBtn,
                        isSelected && styles.optionSelected,
                        showResults && isCorrectOption && styles.optionCorrect,
                        showResults && isSelected && !isCorrectOption && styles.optionWrong
                      ]}
                      onPress={() => handleSelectOption(qIdx, opt)}
                      disabled={showResults}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showResults && (
                <View style={styles.explanationBox}>
                  <Text style={[styles.resultBadge, { color: isCorrect ? '#4CAF50' : '#F44336' }]}>
                    {isCorrect ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${q.answer}`}
                  </Text>
                  <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}

        {!showResults ? (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Nộp bài</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.outline }]} onPress={() => router.back()}>
            <Text style={styles.submitBtnText}>Quay lại</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  
  container: { padding: spacing.lg, gap: spacing.lg },
  passageCard: {
    backgroundColor: '#fff',
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passageTitle: { fontSize: 20, fontWeight: '800', color: colors.primary, marginBottom: spacing.md },
  passageText: { fontSize: 16, lineHeight: 24, color: colors.text, textAlign: 'justify' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  
  questionCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  questionText: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 22 },
  optionsList: { gap: spacing.sm },
  optionBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8F9FE',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionWrong: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  optionText: { fontSize: 15, color: colors.text },
  optionTextSelected: { fontWeight: '700', color: colors.primary },

  explanationBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#F8F9FE',
    borderRadius: radius.md,
    gap: 4,
  },
  resultBadge: { fontWeight: '800', fontSize: 14 },
  explanationText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },

  submitBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
