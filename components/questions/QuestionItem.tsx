import { StyleSheet, Text, TextInput, TouchableOpacity, View, type ViewStyle } from 'react-native';
import type { QuestionDTO } from '@/lib/api/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';

type ResultInfo = {
  is_correct: boolean;
  correct_answer?: string;
};

type QuestionItemProps = {
  question: QuestionDTO;
  index: number;
  selectedAnswer?: string;
  showResults: boolean;
  result?: ResultInfo;
  onSelect: (questionId: string, answer: string) => void;
};

export function QuestionItem({
  question,
  index,
  selectedAnswer,
  showResults,
  result,
  onSelect,
}: QuestionItemProps) {
  const isCorrect = result?.is_correct;
  const options = question.options;

  return (
    <View
      style={[
        styles.card,
        showResults && (isCorrect ? styles.cardOk : styles.cardBad),
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, showResults && (isCorrect ? styles.badgeOk : styles.badgeBad)]}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.content}>{question.content}</Text>
      </View>

      {options && typeof options === 'object' ? (
        <View style={styles.options}>
          {Object.entries(options).map(([key, value]) => {
            const selected = selectedAnswer === key;
            const isKeyCorrect = result?.correct_answer === key;
            const optStyle: ViewStyle[] = [styles.opt];
            if (showResults) {
              if (isKeyCorrect) optStyle.push(styles.optCorrect);
              else if (selected) optStyle.push(styles.optWrong);
            } else if (selected) {
              optStyle.push(styles.optSelected);
            }
            return (
              <TouchableOpacity
                key={key}
                disabled={showResults}
                onPress={() => onSelect(question.id, key)}
              >
                <View style={optStyle}>
                  <Text style={styles.optKey}>{key}</Text>
                  <Text style={styles.optVal}>{value}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TextInput
          style={[styles.input, showResults && (isCorrect ? styles.inputOk : styles.inputBad)]}
          placeholder="Type your answer"
          placeholderTextColor={colors.textMuted}
          value={selectedAnswer ?? ''}
          editable={!showResults}
          onChangeText={(t) => onSelect(question.id, t)}
        />
      )}

      {showResults && !isCorrect && result?.correct_answer ? (
        <Text style={styles.correctHint}>Correct: {result.correct_answer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardOk: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  cardBad: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  header: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOk: { backgroundColor: colors.success },
  badgeBad: { backgroundColor: colors.error },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  content: { ...typography.body, flex: 1, fontWeight: '600' },
  options: { gap: spacing.sm, marginLeft: spacing.xl },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  optSelected: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  optCorrect: { borderColor: colors.success, backgroundColor: '#D1FAE5' },
  optWrong: { borderColor: colors.error, backgroundColor: '#FEE2E2' },
  optKey: { fontWeight: '800', width: 24, color: colors.text },
  optVal: { flex: 1, color: colors.text },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    marginLeft: spacing.xl,
    color: colors.text,
  },
  inputOk: { borderColor: colors.success },
  inputBad: { borderColor: colors.error },
  correctHint: { marginTop: spacing.sm, marginLeft: spacing.xl, color: colors.success, fontWeight: '600' },
});
