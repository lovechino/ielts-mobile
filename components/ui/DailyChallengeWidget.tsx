import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useDailyStore } from '@/stores/useDailyStore';

export function DailyChallengeWidget() {
  const router = useRouter();
  const { tasks, isLoading, isCompleted, rewardClaimed, fetchDailyChallenge, claimReward } = useDailyStore();

  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  if (isLoading && tasks.length === 0) {
    return <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />;
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Thử thách hàng ngày" 
        rightLabel={isCompleted ? "Hoàn thành!" : `${completedCount}/${tasks.length}`}
      />
      
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {isCompleted && !rewardClaimed && (
            <TouchableOpacity style={styles.claimBtn} onPress={claimReward}>
              <Text style={styles.claimText}>Nhận quà</Text>
            </TouchableOpacity>
          )}
          {rewardClaimed && (
            <View style={styles.claimedBadge}>
              <FontAwesome name="check-circle" size={14} color="#00B894" />
              <Text style={styles.claimedText}>Đã nhận</Text>
            </View>
          )}
        </View>

        <View style={styles.taskList}>
          {tasks.map((task) => (
            <TouchableOpacity 
              key={task.id} 
              style={styles.taskItem}
              onPress={() => router.push(task.link as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: getTaskColor(task.type) + '20' }]}>
                <FontAwesome name={getTaskIcon(task.type)} size={16} color={getTaskColor(task.type)} />
              </View>
              <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskDone]}>
                {task.title}
              </Text>
              <View style={[styles.statusCircle, task.status === 'completed' && styles.statusDone]}>
                {task.status === 'completed' && <FontAwesome name="check" size={10} color="white" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

function getTaskIcon(type: string): any {
  switch (type) {
    case 'vocab': return 'book';
    case 'review': return 'refresh';
    case 'reading': return 'file-text-o';
    case 'listening': return 'headphones';
    case 'speaking': return 'microphone';
    default: return 'star';
  }
}

function getTaskColor(type: string) {
  switch (type) {
    case 'vocab': return '#6C5CE7';
    case 'review': return '#00B894';
    case 'reading': return '#F0932B';
    case 'listening': return '#0984E3';
    case 'speaking': return '#E84393';
    default: return colors.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  claimBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  claimText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimedText: {
    color: '#00B894',
    fontSize: 12,
    fontWeight: '600',
  },
  taskList: {
    gap: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  statusCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDone: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
});
