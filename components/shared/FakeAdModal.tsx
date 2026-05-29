import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';

interface FakeAdModalProps {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const AD_DURATION = 5; // giây

export function FakeAdModal({ visible, onComplete, onClose }: FakeAdModalProps) {
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [phase, setPhase] = useState<'watching' | 'done'>('watching');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setCountdown(AD_DURATION);
      setPhase('watching');
      return;
    }

    setCountdown(AD_DURATION);
    setPhase('watching');

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {phase === 'watching' ? (
            <>
              {/* Ad placeholder */}
              <View style={styles.adPlaceholder}>
                <FontAwesome name="play-circle" size={48} color={colors.outlineVariant} />
                <Text style={styles.adLabel}>Quảng cáo</Text>
                <Text style={styles.adSub}>Demo — không có quảng cáo thật</Text>
              </View>

              {/* Countdown */}
              <View style={styles.countdownRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.countdownText}>
                  Có thể bỏ qua sau <Text style={styles.countdownNum}>{countdown}s</Text>
                </Text>
              </View>

              {/* Skip disabled until done */}
              <TouchableOpacity style={styles.skipBtnDisabled} disabled>
                <Text style={styles.skipBtnTextDisabled}>Bỏ qua ({countdown}s)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Done state */}
              <View style={styles.doneIcon}>
                <FontAwesome name="check-circle" size={52} color={colors.tertiary} />
              </View>
              <Text style={styles.doneTitle}>Cảm ơn bạn đã xem!</Text>
              <Text style={styles.doneSub}>Kết quả chi tiết đã được mở khóa.</Text>

              <TouchableOpacity style={styles.unlockBtn} onPress={onComplete}>
                <FontAwesome name="unlock" size={16} color="#fff" />
                <Text style={styles.unlockBtnText}>Xem kết quả đầy đủ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  // Ad placeholder
  adPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  adLabel: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  adSub: { fontSize: 12, color: colors.textMuted },
  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countdownText: { fontSize: 14, color: colors.textSecondary },
  countdownNum: { fontWeight: '700', color: colors.primary },
  // Skip button (disabled)
  skipBtnDisabled: {
    width: '100%',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
  },
  skipBtnTextDisabled: { fontSize: 14, color: colors.textMuted },
  // Done state
  doneIcon: { marginTop: spacing.sm },
  doneTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  doneSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  unlockBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
