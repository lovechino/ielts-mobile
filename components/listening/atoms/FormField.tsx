import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  questionNumber: number;
  isActive?: boolean;
  placeholder?: string;
}

export function FormField({ label, value, onChangeText, questionNumber, isActive, placeholder }: FormFieldProps) {
  return (
    <View style={[styles.row, isActive && styles.rowActive]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, value ? styles.inputFilled : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || '______'}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={[styles.badge, isActive && styles.badgeActive]}>
          <Text style={[styles.badgeText, isActive && { color: '#fff' }]}>{questionNumber}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent',
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, width: 80 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    flex: 1, borderBottomWidth: 2, borderBottomColor: colors.border,
    paddingVertical: 2, fontSize: 15, color: colors.text,
  },
  inputFilled: { borderBottomColor: colors.primary, fontWeight: '600' },
  badge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeActive: { backgroundColor: colors.primary },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
});
