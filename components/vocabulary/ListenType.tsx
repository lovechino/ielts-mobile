import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '@/theme/tokens';
import { useGameStore } from '@/stores/useGameStore';
import { useTTS } from '@/hooks/useTTS';
import { FontAwesome } from '@expo/vector-icons';

interface ListenTypeProps {
  word: string;
  ipa?: string;
  meaning: string;
  onFinish: (isCorrect: boolean) => void;
}

export const ListenType: React.FC<ListenTypeProps> = ({ word, ipa, meaning, onFinish }) => {
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { speak } = useTTS();
  const inputRef = useRef<TextInput>(null);
  
  const shakeOffset = useSharedValue(0);
  const { incrementCombo, resetCombo, addScore } = useGameStore();

  useEffect(() => {
    setInput('');
    setIsCorrect(null);
    setTimeout(() => speak(word), 500);
    inputRef.current?.focus();
  }, [word]);

  const handleSubmit = () => {
    if (isCorrect !== null || !input.trim()) return;

    if (input.trim().toLowerCase() === word.toLowerCase()) {
      setIsCorrect(true);
      addScore(20);
      incrementCombo();
      setTimeout(() => onFinish(true), 1200);
    } else {
      setIsCorrect(false);
      resetCombo();
      shake();
      setTimeout(() => {
        setIsCorrect(null);
        setInput('');
        speak(word);
        inputRef.current?.focus();
      }, 1500);
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.audioSection}>
        <TouchableOpacity 
          style={styles.audioBtn}
          onPress={() => speak(word)}
        >
          <FontAwesome name="volume-up" size={48} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.audioHint}>Chạm để nghe lại</Text>
      </View>

      <Animated.View style={[styles.inputContainer, animatedStyle]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isCorrect === true && styles.correctInput,
            isCorrect === false && styles.wrongInput,
          ]}
          placeholder="Nhập từ bạn nghe được..."
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
          editable={isCorrect === null}
        />
        {isCorrect !== null && (
          <View style={styles.feedbackIcon}>
            <FontAwesome 
              name={isCorrect ? "check-circle" : "times-circle"} 
              size={24} 
              color={isCorrect ? "#4CAF50" : "#F44336"} 
            />
          </View>
        )}
      </Animated.View>

      {!isCorrect && isCorrect !== null && (
        <View style={styles.showAnswer}>
          <Text style={styles.answerLabel}>Đáp án đúng:</Text>
          <Text style={styles.answerText}>{word}</Text>
        </View>
      )}

      <View style={styles.hintCard}>
        <Text style={styles.hintLabel}>Gợi ý nghĩa:</Text>
        <Text style={styles.hintText}>{meaning}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, !input.trim() && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={!input.trim() || isCorrect !== null}
      >
        <Text style={styles.submitBtnText}>Kiểm tra</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl2,
  },
  audioSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  audioBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  audioHint: {
    fontSize: 14,
    color: colors.outline,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 64,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
  },
  correctInput: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  wrongInput: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  feedbackIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  hintCard: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: '#F1F2F6',
    borderRadius: radius.lg,
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.outline,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  showAnswer: {
    alignItems: 'center',
    gap: 4,
  },
  answerLabel: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '700',
  },
  answerText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  disabledBtn: {
    backgroundColor: colors.outline + '40',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
