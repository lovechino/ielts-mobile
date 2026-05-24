import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';

interface QuizOption {
  id: string | number;
  text: string;
  isCorrect: boolean;
}

interface QuizProps {
  question: string;
  options: QuizOption[];
  onAnswer: (option: QuizOption) => void;
  progress?: string;
  selectedOptionId?: string | number | null;
  showResult?: boolean;
}

export function Quiz({ question, options, onAnswer, progress, selectedOptionId, showResult }: QuizProps) {
  return (
    <View style={styles.container}>
      {progress && <Text style={styles.progress}>{progress}</Text>}
      <Text style={styles.question}>{question}</Text>
      <View style={styles.options}>
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrect = opt.isCorrect;
          let bgColor: string = '#fff';
          let borderColor: string = colors.border;
          if (showResult && isSelected) {
            bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';
            borderColor = isCorrect ? '#00855b' : '#ef4444';
          } else if (isSelected) {
            bgColor = '#eff6ff';
            borderColor = colors.primary;
          }
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, { backgroundColor: bgColor, borderColor }]}
              onPress={() => onAnswer(opt)}
              disabled={showResult}
            >
              <Text style={styles.optionText}>{opt.text}</Text>
              {showResult && isSelected && (
                <Text style={{ color: isCorrect ? '#00855b' : '#ef4444', fontWeight: '700', fontSize: 16 }}>
                  {isCorrect ? '✓' : '✗'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  progress: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.md },
  question: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  options: { width: '100%', gap: spacing.sm },
  option: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'center' },
});
