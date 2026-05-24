import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  description: string;
  onPress: () => void;
};

export function PromoBanner({ title, description, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.banner, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.white },
  desc: { fontSize: 13, color: colors.headerBg, marginTop: spacing.xs },
});
