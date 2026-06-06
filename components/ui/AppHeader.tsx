import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing } from '@/theme/tokens';
import { StreakBadge } from './StreakBadge';

type Props = {
  title: string;
  avatarUri?: string;
  avatarLetter?: string;
  streak?: number;
  coins?: number;
  onLeaderboard?: () => void;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
  hideStats?: boolean;
};

export function AppHeader({ title, avatarUri, avatarLetter, streak, coins, onLeaderboard, onBack, rightAction, hideStats }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={18} color={colors.text} />
          </Pressable>
        ) : avatarUri || avatarLetter ? (
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter || 'U'}</Text>
            )}
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {!hideStats && streak !== undefined && <StreakBadge count={streak} />}
        {!hideStats && coins !== undefined && (
          <View style={styles.coinBadge}>
            <FontAwesome name="dollar" size={14} color={colors.tertiary} />
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        )}
        {rightAction ? (
          <Pressable onPress={rightAction.onPress}>
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          </Pressable>
        ) : onLeaderboard ? (
          <Pressable onPress={onLeaderboard} style={styles.iconBtn}>
            <FontAwesome name="trophy" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(247,249,251,0.7)',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    overflow: 'hidden', borderWidth: 2, borderColor: colors.primaryFixed,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.primary, textAlign: 'center', lineHeight: 36 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary },
  backBtn: { padding: spacing.xs },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: 20, backgroundColor: '#FEF9E7',
    borderWidth: 1, borderColor: '#F1C40F40',
  },
  coinText: { fontSize: 13, fontWeight: '700', color: '#B7950B' },
  iconBtn: { padding: spacing.sm },
  rightLabel: { fontSize: 14, color: colors.accent, fontWeight: '600' },
});
