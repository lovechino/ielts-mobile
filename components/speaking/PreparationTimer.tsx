import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

interface PreparationTimerProps {
  timeLeft: number;
  onTimeUp: () => void;
  onTick: (sec: number) => void;
}

export function PreparationTimer({ timeLeft, onTimeUp, onTick }: PreparationTimerProps) {
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current();
      return;
    }
    const id = setTimeout(() => onTick(timeLeft - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, onTick]);

  const critical = timeLeft <= 10;

  useEffect(() => {
    if (critical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [critical, pulseAnim]);

  return (
    <View style={[styles.container, critical && styles.critical]}>
      <Text style={styles.label}>PREPARATION TIME</Text>
      <Animated.Text 
        style={[
          styles.timer, 
          critical && styles.criticalText,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        {timeLeft < 10 ? `0:0${timeLeft}` : `0:${timeLeft}`}
      </Animated.Text>
      <View style={styles.hintBox}>
        <Text style={[styles.hint, critical && styles.criticalText]}>
          {critical ? 'GET READY TO SPEAK!' : 'Read the cue card and prepare...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  critical: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error,
    shadowColor: colors.error,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  timer: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  criticalText: {
    color: colors.error,
  },
  hintBox: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  hint: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
