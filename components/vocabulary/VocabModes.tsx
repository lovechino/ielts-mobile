import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';

interface VocabModesProps {
  activeMode: string;
  onSelectMode: (mode: string) => void;
}

const MODES = [
  { key: 'new', label: 'New Words', desc: 'Learn unfamiliar words' },
  { key: 'review', label: 'Review', desc: 'Reinforce what you know' },
  { key: 'mastered', label: 'Mastered', desc: 'Words you already know' },
];

export function VocabModes({ activeMode, onSelectMode }: VocabModesProps) {
  return (
    <View style={styles.row}>
      {MODES.map((mode) => (
        <TouchableOpacity key={mode.key} style={[styles.modeBtn, activeMode === mode.key && styles.modeBtnActive]} onPress={() => onSelectMode(mode.key)}>
          <Text style={[styles.modeLabel, activeMode === mode.key && styles.modeLabelActive]}>{mode.label}</Text>
          <Text style={[styles.modeDesc, activeMode === mode.key && styles.modeDescActive]}>{mode.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm },
  modeBtn: { flex: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: '#f4f5f7', alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.primary },
  modeLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  modeLabelActive: { color: '#fff' },
  modeDesc: { fontSize: 10, color: colors.textSecondary },
  modeDescActive: { color: 'rgba(255,255,255,0.8)' },
});
