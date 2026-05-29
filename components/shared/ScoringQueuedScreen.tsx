import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { typography } from '@/theme/typography';

interface ScoringQueuedScreenProps {
  lessonTitle: string;
  estimatedMinutes: number;
  message: string;
  onGoHome: () => void;
  onGoHistory: () => void;
}

export function ScoringQueuedScreen({
  lessonTitle,
  estimatedMinutes,
  message,
  onGoHome,
  onGoHistory,
}: ScoringQueuedScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <FontAwesome name="clock-o" size={48} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Bài đã được nộp!</Text>
        <Text style={styles.lessonName} numberOfLines={2}>{lessonTitle}</Text>

        {/* Info box */}
        <View style={styles.infoBox}>
          <FontAwesome name="info-circle" size={16} color={colors.primary} />
          <Text style={styles.infoText}>{message}</Text>
        </View>

        {/* Estimated time */}
        <View style={styles.timeRow}>
          <FontAwesome name="hourglass-half" size={14} color={colors.textMuted} />
          <Text style={styles.timeText}>
            Ước tính: <Text style={styles.timeHighlight}>{estimatedMinutes} phút</Text>
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Upgrade hint */}
        <View style={styles.upgradeHint}>
          <FontAwesome name="star" size={14} color={colors.secondary} />
          <Text style={styles.upgradeText}>
            Nâng cấp <Text style={styles.upgradeBold}>Premium</Text> để nhận kết quả ngay lập tức
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.historyBtn} onPress={onGoHistory}>
            <FontAwesome name="history" size={15} color={colors.primary} />
            <Text style={styles.historyBtnText}>Xem Lịch sử</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome}>
            <Text style={styles.homeBtnText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl2,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  lessonName: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
  },
  infoText: {
    ...typography.body,
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  timeHighlight: {
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondaryFixed,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  upgradeText: {
    fontSize: 13,
    color: colors.secondary,
    flex: 1,
    lineHeight: 18,
  },
  upgradeBold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  historyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  historyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  homeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
