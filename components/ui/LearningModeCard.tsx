import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface LearningModeCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  coins?: number;
  badge?: string;
  bgColor: string;
  onPress?: () => void;
}

export function LearningModeCard({ title, subtitle, icon, coins, badge, bgColor, onPress }: LearningModeCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {coins !== undefined && (
        <View style={styles.coinWrap}>
          <Text style={styles.coinText}>+{coins} </Text>
          <Text style={styles.coinIcon}>🪙</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl2,
    padding: spacing.md,
    minHeight: 150,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: '#ef4444',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 13 },
  coinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
  },
  coinText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  coinIcon: { fontSize: 10 },
});
