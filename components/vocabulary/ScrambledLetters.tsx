import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '@/theme/tokens';
import { useGameStore } from '@/stores/useGameStore';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ScrambledLettersProps {
  word: string;
  meaning: string;
  onFinish: (isCorrect: boolean) => void;
}

export const ScrambledLetters: React.FC<ScrambledLettersProps> = ({ word, meaning, onFinish }) => {
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]); // Indexes in shuffled array
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const shakeOffset = useSharedValue(0);
  const { incrementCombo, resetCombo, addScore } = useGameStore();

  useEffect(() => {
    const letters = word.split('').sort(() => Math.random() - 0.5);
    setShuffled(letters);
    setSelected([]);
    setIsCorrect(null);
  }, [word]);

  const handlePressLetter = (index: number) => {
    if (selected.includes(index) || isCorrect !== null) return;
    
    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === word.length) {
      const currentWord = newSelected.map(i => shuffled[i]).join('');
      if (currentWord.toLowerCase() === word.toLowerCase()) {
        setIsCorrect(true);
        addScore(15);
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
      <View style={styles.hintCard}>
        <Text style={styles.hintLabel}>Gợi ý / Nghĩa:</Text>
        <Text style={styles.hintText}>{meaning}</Text>
      </View>

      <Animated.View style={[styles.answerArea, animatedStyle]}>
        {word.split('').map((_, idx) => {
          const letterIdx = selected[idx];
          return (
            <View 
              key={`answer-${idx}`} 
              style={[
                styles.answerSlot,
                isCorrect === true && styles.correctSlot,
                isCorrect === false && styles.wrongSlot,
              ]}
            >
              <Text style={styles.letterText}>
                {letterIdx !== undefined ? shuffled[letterIdx] : ''}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      <View style={styles.lettersContainer}>
        {shuffled.map((letter, idx) => (
          <TouchableOpacity
            key={`letter-${idx}`}
            disabled={selected.includes(idx) || isCorrect !== null}
            style={[
              styles.letterBtn,
              selected.includes(idx) && styles.usedLetterBtn
            ]}
            onPress={() => handlePressLetter(idx)}
          >
            <Text style={[
              styles.letterText,
              selected.includes(idx) && styles.usedLetterText
            ]}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={undo}>
          <FontAwesome name="undo" size={20} color={colors.text} />
          <Text style={styles.controlText}>Hoàn tác</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlBtn} 
          onPress={() => isCorrect === null && setSelected([])}
        >
          <FontAwesome name="refresh" size={20} color={colors.text} />
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
    gap: spacing.xl,
  },
  hintCard: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.primary + '08',
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
  lettersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  usedLetterText: {
    color: '#bbb',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
