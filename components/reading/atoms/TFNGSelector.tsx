import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface TFNGSelectorProps {
  labels: string[];
  selected: string;
  onSelect: (value: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  TRUE: '#059669',
  FALSE: '#dc2626',
  'NOT GIVEN': '#d97706',
  YES: '#059669',
  NO: '#dc2626',
};

export function TFNGSelector({ labels, selected, onSelect }: TFNGSelectorProps) {
  return (
    <View style={styles.row}>
      {labels.map((label) => {
        const isActive = selected === label;
        const color = COLOR_MAP[label] || colors.primary;
        return (
          <TouchableOpacity
            key={label}
            style={[styles.btn, isActive && { backgroundColor: color, borderColor: color }]}
            onPress={() => onSelect(label)}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnText, isActive && styles.btnTextActive]}>
              {label === 'NOT GIVEN' ? 'NG' : label.charAt(0)}
            </Text>
            {!isActive && <Text style={styles.btnLabel}>{label}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit + 2,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
  },
  btnText: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, width: 20, textAlign: 'center' },
  btnTextActive: { color: '#fff' },
  btnLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
});
