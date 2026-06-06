import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { ProgressResultItem } from '@/lib/api/types';
import { ReadingListeningReport } from './ExamResult/ReadingListeningReport';
import { WritingReport, type WritingAIFeedback } from './ExamResult/WritingReport';

export type { WritingAIFeedback };

interface ExamResultModalProps {
  visible: boolean;
  lessonTitle: string;
  lessonType: 'reading' | 'listening' | 'writing';
  score: number;
  totalQuestions: number;
  results: ProgressResultItem[];
  writingFeedback?: WritingAIFeedback;
  rewardCoins?: number | null;
  onDone: () => void;
}

export function ExamResultModal({
  visible, lessonTitle, lessonType,
  score, totalQuestions, results,
  writingFeedback, rewardCoins, onDone,
}: ExamResultModalProps) {
  const isWriting = lessonType === 'writing';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <FontAwesome
              name={isWriting ? 'pencil' : 'check-circle'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>{lessonTitle}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!!rewardCoins && rewardCoins > 0 && (
              <View style={styles.rewardBanner}>
                <FontAwesome name="database" size={24} color="#F1C40F" />
                <View>
                  <Text style={styles.rewardTitle}>Thưởng hoàn thành</Text>
                  <Text style={styles.rewardValue}>+{rewardCoins} Xu</Text>
                </View>
              </View>
            )}

            {isWriting ? (
              <WritingReport score={score} feedback={writingFeedback} />
            ) : (
              <ReadingListeningReport
                score={score}
                totalQuestions={totalQuestions}
                results={results}
              />
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
              <Text style={styles.doneBtnText}>Hoàn thành</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    maxHeight: '92%',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  headerTitle: {
    flex: 1, fontSize: 16, fontWeight: '700', color: colors.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  doneBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  rewardBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FEF9E7',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F1C40F40',
    marginBottom: spacing.xs,
    ...shadow.card,
  },
  rewardTitle: { fontSize: 12, fontWeight: '600', color: '#B7950B', textTransform: 'uppercase' },
  rewardValue: { fontSize: 20, fontWeight: '800', color: '#B7950B' },
});
