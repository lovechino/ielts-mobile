import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface WordBankPanelProps {
  words: string[];
  usedWords: string[];
  onSelect: (word: string) => void;
}

export function WordBankPanel({ words, usedWords, onSelect }: WordBankPanelProps) {
  if (words.length === 0) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Word Bank</Text>
      <View style={styles.row}>
        {words.map((word) => {
          const used = usedWords.includes(word);
          return (
            <TouchableOpacity
              key={word}
              style={[styles.chip, used && styles.chipUsed]}
              onPress={() => !used && onSelect(word)}
              disabled={used}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, used && styles.chipTextUsed]}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.md, padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
    borderRadius: radius.pill, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.primary,
  },
  chipUsed: { opacity: 0.4, borderColor: colors.border },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  chipTextUsed: { color: colors.textMuted },
});
