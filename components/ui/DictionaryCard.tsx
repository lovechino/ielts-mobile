import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type Props = {
  word: string;
  meaning?: string | null;
  onPress: () => void;
};

export function DictionaryCard({ word, meaning, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <Text style={styles.word}>{word}</Text>
      {meaning ? <Text style={styles.meaning} numberOfLines={2}>{meaning}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  word: { fontSize: 16, fontWeight: '700', color: colors.text },
  meaning: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
});
