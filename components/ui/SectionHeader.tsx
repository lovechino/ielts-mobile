import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
};

export function SectionHeader({ title, subtitle, rightLabel }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  rightLabel: { fontSize: 14, color: colors.outline, fontWeight: '600' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
});
