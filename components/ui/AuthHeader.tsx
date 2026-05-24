import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
};

export function AuthHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});
