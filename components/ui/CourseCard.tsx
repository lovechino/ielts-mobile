import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  description?: string | null;
  level?: string | null;
  onPress: () => void;
};

export function CourseCard({ title, description, level, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.desc} numberOfLines={2}>{description}</Text> : null}
        {level ? <Text style={styles.badge}>{level}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  body: { gap: spacing.xs },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  badge: { fontSize: 12, fontWeight: '600', color: colors.accent, marginTop: spacing.xs },
});
