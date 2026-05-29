import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';

interface SpeakingTimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
  visible?: boolean;
  stopped?: boolean; // Dừng timer từ bên ngoài (khi user bấm End)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function SpeakingTimer({ totalSeconds, onTimeUp, visible = true, stopped = false }: SpeakingTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    // Dừng timer nếu stopped=true
    if (stopped) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stopped]);

  if (!visible) return null;

  const isWarning = remaining <= 60;
  const isCritical = remaining <= 30;

  return (
    <View style={[styles.timer, isWarning && styles.timerWarning, isCritical && styles.timerCritical]}>
      <Text style={[styles.text, isWarning && styles.textWarning, isCritical && styles.textCritical]}>
        {formatTime(remaining)}
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
  timerWarning: {
    backgroundColor: colors.secondaryFixedDim,
  },
  timerCritical: {
    backgroundColor: colors.errorContainer,
  },
  text: {
    fontSize: 14, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'],
  },
  textWarning: { color: colors.onSecondaryFixedVariant },
  textCritical: { color: colors.onErrorContainer },
});
