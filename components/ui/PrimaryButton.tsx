import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, disabled, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.9 },
  text: { color: colors.white, fontWeight: '700', fontSize: 16 },
  textDisabled: { color: colors.textMuted },
});
