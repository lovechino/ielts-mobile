import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface VocabWord {
  id: string | number;
  word: string;
  meaning: string;
  example?: string;
  mastered?: boolean;
}

interface VocabWordListProps {
  words: VocabWord[];
  onPressWord: (word: VocabWord) => void;
}

export function VocabWordList({ words, onPressWord }: VocabWordListProps) {
  return (
    <View style={styles.list}>
      {words.map((w) => (
        <TouchableOpacity key={w.id} style={styles.item} onPress={() => onPressWord(w)}>
          <View style={styles.itemLeft}>
            <View style={[styles.statusDot, { backgroundColor: w.mastered ? '#00855b' : '#c0c4cc' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.wordText}>{w.word}</Text>
              <Text style={styles.meaningText}>{w.meaning}</Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#c0c4cc" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.md },
  wordText: { fontSize: 16, fontWeight: '600', color: colors.text },
  meaningText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
