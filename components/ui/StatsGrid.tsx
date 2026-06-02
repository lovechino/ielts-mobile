import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type StatItem = { value: string; label: string; color?: string; onPress?: () => void };

type StatsGridProps = {
  items: StatItem[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item, idx) => (
        <Pressable 
          key={idx} 
          style={styles.card} 
          onPress={item.onPress}
          disabled={!item.onPress}
        >
          <Text style={[styles.value, item.color ? { color: item.color } : undefined]}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(194,198,214,0.3)',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 24, fontWeight: '700', color: colors.text },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
});
