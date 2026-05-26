import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

interface PreparationTimerProps {
  timeLeft: number;
  onTimeUp: () => void;
  onTick: (sec: number) => void;
}

export function PreparationTimer({ timeLeft, onTimeUp, onTick }: PreparationTimerProps) {
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current();
      return;
    }
    const id = setTimeout(() => onTick(timeLeft - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, onTick]);

  const critical = timeLeft <= 10;

  return (
    <View style={[styles.container, critical && styles.critical]}>
      <Text style={styles.label}>Preparation Time</Text>
      <Text style={[styles.timer, critical && styles.criticalText]}>
        {timeLeft < 10 ? `0:0${timeLeft}` : `0:${timeLeft}`}
      </Text>
      <Text style={styles.hint}>
        {critical ? 'Start speaking now!' : 'Prepare your answer...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  critical: {
    backgroundColor: '#fff0f0',
    borderColor: colors.error,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  timer: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  criticalText: {
    color: colors.error,
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
