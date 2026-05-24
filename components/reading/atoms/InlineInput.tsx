import { TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface InlineInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxWords?: number;
}

export function InlineInput({ value, onChangeText, placeholder, maxWords }: InlineInputProps) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <TextInput
      style={[styles.input, value ? styles.inputFilled : null]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || '___'}
      placeholderTextColor={colors.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="next"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 2, borderBottomColor: colors.border,
    paddingVertical: 2, paddingHorizontal: spacing.xs,
    fontSize: 15, color: colors.text, minWidth: 80,
    backgroundColor: 'transparent',
  },
  inputFilled: { borderBottomColor: colors.primary, fontWeight: '600' },
});
