import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

const TOPICS = ['Environment', 'Technology', 'Education', 'Health', 'Travel', 'Culture', 'Work', 'Society'];

interface VocabCustomizerProps {
  selectedTopics: string[];
  onToggleTopic: (topic: string) => void;
}

export function VocabCustomizer({ selectedTopics, onToggleTopic }: VocabCustomizerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customize Your Word List</Text>
      <Text style={styles.subtitle}>Select topics to focus on:</Text>
      <View style={styles.chipRow}>
        {TOPICS.map((topic) => {
          const active = selectedTopics.includes(topic);
          return (
            <TouchableOpacity key={topic} style={[styles.chip, active && styles.chipActive]} onPress={() => onToggleTopic(topic)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{topic}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: '#f4f5f7', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
});
