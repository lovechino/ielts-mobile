import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

const LEVELS = [
  { id: 'a1', label: 'A1', name: 'Beginner', count: 40, color: '#22c55e' },
  { id: 'a2', label: 'A2', name: 'Elementary', count: 85, color: '#16a34a' },
  { id: 'b1', label: 'B1', name: 'Intermediate', count: 150, color: '#fd761a' },
  { id: 'b2', label: 'B2', name: 'Upper Intermediate', count: 180, color: '#ea580c' },
  { id: 'c1', label: 'C1', name: 'Advanced', count: 100, color: '#0058be' },
  { id: 'c2', label: 'C2', name: 'Proficient', count: 35, color: '#1e40af' },
];

interface VocabularyLevelGridProps {
  onSelectLevel?: (levelId: string) => void;
}

export function VocabularyLevelGrid({ onSelectLevel }: VocabularyLevelGridProps) {
  return (
    <View style={styles.grid}>
      {LEVELS.map((level) => (
        <TouchableOpacity key={level.id} style={styles.card} onPress={() => onSelectLevel?.(level.id)}>
          <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
            <Text style={styles.levelLabel}>{level.label}</Text>
          </View>
          <Text style={styles.levelName}>{level.name}</Text>
          <Text style={styles.levelCount}>{level.count} words</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  levelBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  levelLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  levelName: { fontSize: 14, fontWeight: '600', color: colors.text },
  levelCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
