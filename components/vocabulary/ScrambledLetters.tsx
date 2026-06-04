import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal,
} from 'react-native';
import Animated, {
  useAnimatedStyle, withSequence, withTiming, withRepeat, useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { useGameStore } from '@/stores/useGameStore';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ScrambledLettersProps {
  word: string;
  meaning: string;
  onFinish: (isCorrect: boolean) => void;
}

// ─── Tutorial Modal ───────────────────────────────────────────────────────────

function TutorialModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const steps = [
    {
      icon: 'eye' as const,
      color: '#6C5CE7',
      title: 'Đọc gợi ý',
      desc: 'Nhìn vào nghĩa tiếng Việt ở trên để đoán từ cần ghép.',
    },
    {
      icon: 'hand-o-up' as const,
      color: '#00B894',
      title: 'Nhấn chọn ký tự',
      desc: 'Chạm vào từng ký tự ở hàng dưới theo đúng thứ tự của từ.',
    },
    {
      icon: 'undo' as const,
      color: '#F0932B',
      title: 'Hoàn tác',
      desc: 'Nhấn "Hoàn tác" để xóa ký tự vừa chọn, hoặc "Làm lại" để reset toàn bộ.',
    },
    {
      icon: 'lightbulb-o' as const,
      color: '#E84393',
      title: 'Gợi ý chữ cái',
      desc: 'Nếu bí quá, nhấn "Gợi ý" để hé lộ 1 ký tự đúng tiếp theo.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tutStyles.backdrop}>
        <View style={tutStyles.card}>
          {/* Header */}
          <View style={tutStyles.header}>
            <Text style={tutStyles.title}>Cách chơi</Text>
            <TouchableOpacity onPress={onClose} style={tutStyles.closeBtn}>
              <FontAwesome name="times" size={18} color={colors.outline} />
            </TouchableOpacity>
          </View>

          {/* Steps */}
          <View style={tutStyles.steps}>
            {steps.map((step, i) => (
              <View key={i} style={tutStyles.step}>
                <View style={[tutStyles.stepIcon, { backgroundColor: step.color + '20' }]}>
                  <FontAwesome name={step.icon} size={18} color={step.color} />
                </View>
                <View style={tutStyles.stepText}>
                  <Text style={tutStyles.stepTitle}>{step.title}</Text>
                  <Text style={tutStyles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Example */}
          <View style={tutStyles.example}>
            <Text style={tutStyles.exampleLabel}>Ví dụ</Text>
            <Text style={tutStyles.exampleMeaning}>Nghĩa: "quả táo"</Text>
            <View style={tutStyles.exampleLetters}>
              {['A', 'P', 'P', 'L', 'E'].map((l, i) => (
                <View key={i} style={tutStyles.exLetter}>
                  <Text style={tutStyles.exLetterText}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={tutStyles.btn} onPress={onClose}>
            <Text style={tutStyles.btnText}>Bắt đầu chơi!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const tutStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.xl2,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  steps: { gap: spacing.md },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepText: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  stepDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  example: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  exampleLabel: { fontSize: 11, fontWeight: '800', color: colors.outline, textTransform: 'uppercase' },
  exampleMeaning: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
  exampleLetters: { flexDirection: 'row', gap: spacing.xs },
  exLetter: {
    width: 36, height: 40,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  exLetterText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export const ScrambledLetters: React.FC<ScrambledLettersProps> = ({ word, meaning, onFinish }) => {
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hintCount, setHintCount] = useState(0); // số lần đã dùng hint

  const shakeOffset = useSharedValue(0);
  const { incrementCombo, resetCombo, addScore } = useGameStore();

  useEffect(() => {
    const letters = word.split('').sort(() => Math.random() - 0.5);
    setShuffled(letters);
    setSelected([]);
    setIsCorrect(null);
    setHintCount(0);
  }, [word]);

  const handlePressLetter = (index: number) => {
    if (selected.includes(index) || isCorrect !== null) return;

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === word.length) {
      const currentWord = newSelected.map(i => shuffled[i]).join('');
      if (currentWord.toLowerCase() === word.toLowerCase()) {
        setIsCorrect(true);
        // Điểm trừ dần theo số hint đã dùng
        addScore(Math.max(5, 15 - hintCount * 3));
        incrementCombo();
        setTimeout(() => onFinish(true), 1000);
      } else {
        setIsCorrect(false);
        resetCombo();
        shake();
        setTimeout(() => {
          setIsCorrect(null);
          setSelected([]);
        }, 1000);
      }
    }
  };

  const undo = () => {
    if (selected.length > 0 && isCorrect === null) {
      setSelected(selected.slice(0, -1));
    }
  };

  /** Gợi ý: tìm ký tự đúng tiếp theo và tự động chọn */
  const handleHint = () => {
    if (isCorrect !== null) return;
    const nextPos = selected.length; // vị trí cần điền tiếp theo
    const correctLetter = word[nextPos]?.toLowerCase();
    if (!correctLetter) return;

    // Tìm index trong shuffled chưa được dùng mà match correctLetter
    const candidateIdx = shuffled.findIndex(
      (l, i) => l.toLowerCase() === correctLetter && !selected.includes(i)
    );
    if (candidateIdx === -1) return;

    setSelected(prev => [...prev, candidateIdx]);
    setHintCount(h => h + 1);

    // Auto-check nếu đã đủ
    const newSelected = [...selected, candidateIdx];
    if (newSelected.length === word.length) {
      setIsCorrect(true);
      addScore(Math.max(2, 15 - (hintCount + 1) * 3));
      incrementCombo();
      setTimeout(() => onFinish(true), 1000);
    }
  };

  const shake = () => {
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Tutorial Modal */}
      <TutorialModal visible={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Hint card + nút hướng dẫn */}
      <View style={styles.hintCard}>
        <View style={styles.hintRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hintLabel}>Gợi ý / Nghĩa:</Text>
            <Text style={styles.hintText}>{meaning}</Text>
          </View>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => setShowTutorial(true)}
          >
            <FontAwesome name="question-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Answer slots */}
      <Animated.View style={[styles.answerArea, animatedStyle]}>
        {word.split('').map((_, idx) => {
          const letterIdx = selected[idx];
          // Highlight hint slots
          const isHintSlot = idx < hintCount;
          return (
            <View
              key={`answer-${idx}`}
              style={[
                styles.answerSlot,
                isCorrect === true && styles.correctSlot,
                isCorrect === false && styles.wrongSlot,
                isHintSlot && isCorrect === null && styles.hintSlot,
              ]}
            >
              <Text style={[
                styles.letterText,
                isHintSlot && isCorrect === null && styles.hintLetterText,
              ]}>
                {letterIdx !== undefined ? shuffled[letterIdx] : ''}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Letter buttons */}
      <View style={styles.lettersContainer}>
        {shuffled.map((letter, idx) => (
          <TouchableOpacity
            key={`letter-${idx}`}
            disabled={selected.includes(idx) || isCorrect !== null}
            style={[
              styles.letterBtn,
              selected.includes(idx) && styles.usedLetterBtn,
            ]}
            onPress={() => handlePressLetter(idx)}
          >
            <Text style={[
              styles.letterText,
              selected.includes(idx) && styles.usedLetterText,
            ]}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={undo}>
          <FontAwesome name="undo" size={18} color={colors.text} />
          <Text style={styles.controlText}>Hoàn tác</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={handleHint}>
          <FontAwesome name="lightbulb-o" size={18} color="#F0932B" />
          <Text style={[styles.controlText, { color: '#F0932B' }]}>
            Gợi ý{hintCount > 0 ? ` (${hintCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => { if (isCorrect === null) setSelected([]); }}
        >
          <FontAwesome name="refresh" size={18} color={colors.text} />
          <Text style={styles.controlText}>Làm lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
  },
  hintCard: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.primary + '08',
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
    fontWeight: '500',
  },
  helpBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  answerArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 60,
  },
  answerSlot: {
    width: 45,
    height: 55,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: radius.xs,
  },
  correctSlot: {
    borderBottomColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  wrongSlot: {
    borderBottomColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  hintSlot: {
    borderBottomColor: '#F0932B',
    backgroundColor: '#FFF3E0',
  },
  lettersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  letterBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  usedLetterBtn: {
    backgroundColor: '#eee',
    borderColor: '#ddd',
    elevation: 0,
    shadowOpacity: 0,
  },
  letterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  usedLetterText: { color: '#bbb' },
  hintLetterText: { color: '#F0932B' },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
