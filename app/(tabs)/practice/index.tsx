/**
 * Practice Tab — Trung tâm Mini-games & Daily Quest
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useDailyStore } from '@/stores/useDailyStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStreakStore } from '@/stores/useStreakStore';

// ─── Game definitions ─────────────────────────────────────────────────────────

const GAMES = [
  {
    id: 'flashcard',
    title: 'Flashcard',
    subtitle: 'Lật thẻ · SRS thông minh',
    icon: 'clone' as const,
    color: '#6C5CE7',
    bg: '#EDE9FF',
    route: '/vocabulary/flashcard',
  },
  {
    id: 'match',
    title: 'Nối từ',
    subtitle: 'Ghép từ với nghĩa',
    icon: 'th-large' as const,
    color: '#00B894',
    bg: '#E0F7F1',
    route: '/vocabulary/practice?type=match',
  },
  {
    id: 'scramble',
    title: 'Sắp xếp chữ',
    subtitle: 'Ghép ký tự thành từ',
    icon: 'font' as const,
    color: '#F0932B',
    bg: '#FFF3E0',
    route: '/vocabulary/practice?type=scramble',
  },
  {
    id: 'listen_type',
    title: 'Nghe & Viết',
    subtitle: 'Nghe audio, gõ từ đúng',
    icon: 'headphones' as const,
    color: '#0058be',
    bg: '#E8F0FF',
    route: '/vocabulary/practice?type=listen_type',
  },
];

// ─── Task type icons ──────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  vocab:    { icon: 'book',        color: '#6C5CE7', bg: '#EDE9FF' },
  review:   { icon: 'refresh',     color: '#00B894', bg: '#E0F7F1' },
  reading:  { icon: 'file-text-o', color: '#0058be', bg: '#E8F0FF' },
  listening:{ icon: 'headphones',  color: '#F0932B', bg: '#FFF3E0' },
  speaking: { icon: 'microphone',  color: '#E84393', bg: '#FFE8F4' },
};

// ─── GameCard ─────────────────────────────────────────────────────────────────

function GameCard({ game, onPress }: { game: typeof GAMES[0]; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.gameCard, { backgroundColor: game.bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.gameIconWrap, { backgroundColor: game.color }]}>
        <FontAwesome name={game.icon} size={22} color="#fff" />
      </View>
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle}>{game.title}</Text>
        <Text style={styles.gameSub}>{game.subtitle}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={game.color} />
    </TouchableOpacity>
  );
}

// ─── DailyTaskRow ─────────────────────────────────────────────────────────────

function DailyTaskRow({ task, onPress }: { task: any; onPress: () => void }) {
  const meta = TASK_ICONS[task.type] || TASK_ICONS.vocab;
  const done = task.status === 'completed';

  return (
    <TouchableOpacity
      style={[styles.taskRow, done && styles.taskRowDone]}
      onPress={onPress}
      disabled={done}
      activeOpacity={0.75}
    >
      <View style={[styles.taskIcon, { backgroundColor: done ? '#E8F5E9' : meta.bg }]}>
        <FontAwesome
          name={done ? 'check' : meta.icon}
          size={16}
          color={done ? '#2E7D32' : meta.color}
        />
      </View>
      <Text style={[styles.taskTitle, done && styles.taskTitleDone]} numberOfLines={1}>
        {task.title}
      </Text>
      {done && (
        <View style={styles.doneChip}>
          <Text style={styles.doneChipText}>Xong</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const streak = useStreakStore((s) => s.streakCount);
  const { tasks, isCompleted, rewardClaimed, isLoading, fetchDailyChallenge, claimReward } = useDailyStore();

  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Screen>
      <AppHeader
        title="Luyện tập"
        streak={streak}
        coins={user?.coins || 0}
        onLeaderboard={() => {}}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Daily Quest Card ── */}
        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <View style={styles.dailyTitleRow}>
              <FontAwesome name="calendar-check-o" size={18} color={colors.primary} />
              <Text style={styles.dailyTitle}>Daily Quest</Text>
            </View>
            {isCompleted && !rewardClaimed && (
              <TouchableOpacity style={styles.claimBtn} onPress={claimReward}>
                <FontAwesome name="gift" size={13} color="#fff" />
                <Text style={styles.claimBtnText}>Nhận thưởng</Text>
              </TouchableOpacity>
            )}
            {rewardClaimed && (
              <View style={styles.claimedBadge}>
                <FontAwesome name="check" size={11} color={colors.tertiary} />
                <Text style={styles.claimedText}>Đã nhận</Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.questProgressBg}>
            <View style={[styles.questProgressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.questProgressLabel}>
            {completedCount}/{totalCount} nhiệm vụ hoàn thành
          </Text>

          {/* Tasks */}
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : tasks.length === 0 ? (
            <Text style={styles.emptyTasks}>Không có nhiệm vụ hôm nay</Text>
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task) => (
                <DailyTaskRow
                  key={task.id}
                  task={task}
                  onPress={() => router.push(task.link as any)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Mini-games ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trò chơi từ vựng</Text>
          <Text style={styles.sectionSub}>Học qua chơi · Tích XP mỗi ngày</Text>
          <View style={styles.gameList}>
            {GAMES.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => router.push(game.route as any)}
              />
            ))}
          </View>
        </View>

        {/* ── Quick links ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Luyện tập thêm</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/vocabulary/pronounce')}
            >
              <FontAwesome name="microphone" size={24} color="#E84393" />
              <Text style={styles.quickTitle}>Phát âm</Text>
              <Text style={styles.quickSub}>AI chấm điểm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/vocabulary/vault')}
            >
              <FontAwesome name="bookmark" size={24} color={colors.primary} />
              <Text style={styles.quickTitle}>Sổ tay</Text>
              <Text style={styles.quickSub}>Từ đã lưu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/vocabulary/words')}
            >
              <FontAwesome name="list" size={24} color={colors.tertiary} />
              <Text style={styles.quickTitle}>Từ điển</Text>
              <Text style={styles.quickSub}>100k từ</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, gap: spacing.lg },

  // Daily card
  dailyCard: {
    margin: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dailyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dailyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  claimBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  claimedText: { fontSize: 12, fontWeight: '700', color: colors.tertiary },

  questProgressBg: {
    height: 8,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  questProgressLabel: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },

  taskList: { gap: spacing.sm },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  taskRowDone: { opacity: 0.65 },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  doneChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  doneChipText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  emptyTasks: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  // Games
  section: { paddingHorizontal: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: -spacing.xs },
  gameList: { gap: spacing.sm },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  gameIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: { flex: 1 },
  gameTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  gameSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  // Quick links
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  quickSub: { fontSize: 11, color: colors.textMuted },
});
