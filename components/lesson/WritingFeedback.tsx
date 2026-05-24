import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { typography } from '@/theme/typography';

interface WritingFeedbackProps {
  feedback: {
    overall_score?: number;
    criteria_scores?: Record<string, number>;
    feedback?: string;
    suggested_version?: string;
  } | undefined;
}

export function WritingFeedback({ feedback }: WritingFeedbackProps) {
  if (!feedback) {
    return (
      <View style={styles.feedbackPending}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.feedbackPendingText}>AI is analyzing your response...</Text>
        <Text style={styles.feedbackPendingSub}>This usually takes 10-20 seconds. Please stay on this page.</Text>
      </View>
    );
  }

  const scores = feedback.criteria_scores || {};
  return (
    <View style={styles.feedbackContainer}>
      <Text style={styles.feedbackHeader}>AI Grading & Feedback</Text>

      <View style={styles.scoresGrid}>
        {Object.entries(scores).map(([key, score]: any) => (
          <View key={key} style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>{key.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.scoreValue}>Band {score}</Text>
          </View>
        ))}
      </View>

      <View style={styles.commentsCard}>
        <Text style={styles.commentsTitle}>AI Feedback & Comments</Text>
        <Text style={styles.commentsBody}>{feedback.feedback}</Text>
      </View>

      {feedback.suggested_version ? (
        <View style={styles.suggestedCard}>
          <Text style={styles.suggestedTitle}>Suggested Band 8+ Version</Text>
          <Text style={styles.suggestedBody}>{feedback.suggested_version}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackPending: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  feedbackPendingText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  feedbackPendingSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  feedbackHeader: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  scoreCard: {
    width: '48%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  scoreValue: {
    ...typography.h3,
    color: '#3B82F6',
  },
  commentsCard: {
    backgroundColor: '#3B82F6',
    padding: spacing.xl,
    borderRadius: radius.xl,
    ...shadow.card,
  },
  commentsTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  commentsBody: {
    ...typography.body,
    color: '#E0F2FE',
    lineHeight: 22,
  },
  suggestedCard: {
    backgroundColor: colors.successBg,
    borderWidth: 2,
    borderColor: '#D1FAE5',
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  suggestedTitle: {
    ...typography.h3,
    color: '#065F46',
    marginBottom: spacing.sm,
  },
  suggestedBody: {
    ...typography.body,
    color: '#047857',
    fontFamily: 'serif',
    lineHeight: 24,
  },
});
