import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';

interface PartSectionHeaderProps {
  partNumber: number;
  title?: string | null;
}

/**
 * Visual separator between IELTS parts in mixed-part tests.
 * Displays "PART 1", "PART 2", or "PART 3" with an optional passage title.
 */
export function PartSectionHeader({ partNumber, title }: PartSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PART {partNumber}</Text>
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
