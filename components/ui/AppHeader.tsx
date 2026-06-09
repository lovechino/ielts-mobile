import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing } from '@/theme/tokens';
import { StreakBadge } from './StreakBadge';

type Props = {
  title: string;
  avatarUri?: string;
  avatarFrame?: string | null;
  streak?: number;
  coins?: number;
  onLeaderboard?: () => void;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
  hideStats?: boolean;
};

export function AppHeader({ title, avatarUri, avatarFrame, streak, coins, onLeaderboard, onBack, rightAction, hideStats }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={18} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.brandIconContainer}>
            <View style={styles.brandIcon}>
              {avatarUri ? (
                <Image source={{ uri: `${avatarUri}${avatarUri.includes('?') ? '&' : '?'}v=${Date.now()}` }} style={styles.avatarImg} />
              ) : (
                <FontAwesome name="paw" size={18} color={colors.secondary} />
              )}
            </View>
            {avatarFrame && (
              <Image source={{ uri: `${avatarFrame}${avatarFrame.includes('?') ? '&' : '?'}v=${Date.now()}` }} style={styles.frameImg} resizeMode="contain" />
            )}
          </View>
        )}
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
  brandIconContainer: { position: 'relative', width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  brandIcon: {
    width: 32, height: 32, borderRadius: 16,
    overflow: 'hidden', backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  frameImg: { position: 'absolute', top: 0, left: 0, width: 48, height: 48, zIndex: 1, backgroundColor: 'transparent' },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
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
