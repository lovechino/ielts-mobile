import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';

interface FlashcardProps {
  word: string;
  meaning: string;
  example?: string;
  isFlipped: boolean;
  onFlip: () => void;
  cardIndex?: string;
}

export function Flashcard({ word, meaning, example, isFlipped, onFlip, cardIndex }: FlashcardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onFlip} activeOpacity={0.9}>
      {cardIndex && <Text style={styles.cardIndex}>{cardIndex}</Text>}
      {!isFlipped ? (
        <View style={styles.face}>
          <Text style={styles.word}>{word}</Text>
          <Text style={styles.hint}>Tap to reveal meaning</Text>
        </View>
      ) : (
        <View style={styles.face}>
          <Text style={styles.meaning}>{meaning}</Text>
          {example && <Text style={styles.example}>{example}</Text>}
          <Text style={styles.hint}>Tap to flip back</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', minHeight: 240, backgroundColor: '#fff', borderRadius: radius.xl, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardIndex: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, position: 'absolute', top: spacing.md, right: spacing.md },
  face: { alignItems: 'center' },
  word: { fontSize: 32, fontWeight: '800', color: colors.primary, marginBottom: spacing.lg },
  meaning: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  example: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  hint: { fontSize: 12, color: '#c0c4cc', marginTop: spacing.xl },
});
