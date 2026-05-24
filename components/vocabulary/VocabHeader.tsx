import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface VocabHeaderProps {
  title: string;
  wordCount: number;
  masteredCount: number;
  onBack?: () => void;
}

export function VocabHeader({ title, wordCount, masteredCount, onBack }: VocabHeaderProps) {
  const progress = wordCount > 0 ? masteredCount / wordCount : 0;
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <FontAwesome name="bookmark" size={14} color="#727785" style={{ marginRight: 4 }} />
          <Text style={styles.statText}>{wordCount} words</Text>
        </View>
        <View style={styles.stat}>
          <FontAwesome name="check-circle" size={14} color="#00855b" style={{ marginRight: 4 }} />
          <Text style={[styles.statText, { color: '#00855b' }]}>{masteredCount} mastered</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { marginBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 13, color: '#727785', fontWeight: '500' },
  progressBar: { height: 4, backgroundColor: '#eceef0', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#00855b', borderRadius: 2 },
});
