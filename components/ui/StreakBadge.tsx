import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/tokens';

type StreakBadgeProps = {
  count: number;
  color?: string;
  size?: 'sm' | 'md';
};

export function StreakBadge({ count, color = colors.secondary, size = 'sm' }: StreakBadgeProps) {
  const isSm = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}30` }]}>
      <FontAwesome name="fire" size={isSm ? 14 : 18} color={color} />
      <Text style={[styles.count, { color, fontSize: isSm ? 13 : 16 }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    borderRadius: radius.full,
  },
  count: { fontWeight: '700' },
});
