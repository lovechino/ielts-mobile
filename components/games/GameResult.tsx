/**
 * Shared result screen used by all minigame modes.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface GameResultProps {
  correct: number;
  total: number;
  coins: number;
  onDone: () => void;
  onRetry: () => void;
}

export function GameResult({ correct, total, coins, onDone, onRetry }: GameResultProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const grade = pct >= 80 ? { label: 'Xuất sắc! 🏆', color: '#00B894' }
    : pct >= 60 ? { label: 'Tốt lắm! 👏', color: '#FDCB6E' }
    : { label: 'Cần ôn thêm 💪', color: '#EF5350' };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.gradeText}>{grade.label}</Text>

        {/* Score ring */}
        <View style={[styles.ring, { borderColor: grade.color }]}>
          <Text style={[styles.ringPct, { color: grade.color }]}>{pct}%</Text>
          <Text style={styles.ringLabel}>{correct}/{total} đúng</Text>
        </View>

        {/* Coins */}
        <View style={styles.coinRow}>
          <FontAwesome name="database" size={14} color="#F1C40F" />
          <Text style={styles.coinText}>+{coins} Xu</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <FontAwesome name="refresh" size={14} color={colors.primary} />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
            <Text style={styles.doneText}>Hoàn thành</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: radius.xl2, padding: spacing.xl, alignItems: 'center', gap: spacing.lg, ...shadow.card },
  gradeText: { fontSize: 24, fontWeight: '800', color: colors.text },
  ring: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 28, fontWeight: '800' },
  ringLabel: { fontSize: 12, color: colors.textMuted },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF9E7', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: '#F1C40F40' },
  coinText: { fontSize: 14, fontWeight: '700', color: '#B7950B' },
  btnRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  retryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.primary },
  retryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  doneBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primary },
  doneText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
