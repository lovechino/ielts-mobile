import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTestStore } from '@/stores/useTestStore';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function ExamTimer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { remainingSeconds, decrementTime, isCompleted } = useTestStore();
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const firedRef = useRef(false);

  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      const current = useTestStore.getState().remainingSeconds;
      if (current <= 1 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(interval);
        onTimeUpRef.current?.();
        return;
      }
      decrementTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60;
  const isCritical = remainingSeconds <= 60;

  return (
    <View style={[styles.timer, isWarning && styles.timerWarning, isCritical && styles.timerCritical]}>
      <Text style={[styles.text, isWarning && styles.textWarning, isCritical && styles.textCritical]}>
        {formatTime(remainingSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timer: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    minWidth: 56,
    alignItems: 'center',
  },
  timerWarning: { backgroundColor: colors.secondaryFixedDim },
  timerCritical: { backgroundColor: colors.errorContainer },
  text: { fontSize: 14, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  textWarning: { color: colors.onSecondaryFixedVariant },
  textCritical: { color: colors.onErrorContainer },
});
