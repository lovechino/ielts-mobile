import { View, ScrollView, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { TestListItem } from '@/components/ui/TestListItem';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { FakeAdModal } from '@/components/shared/FakeAdModal';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { getDashboard } from '@/lib/api/stats';
import { getTests } from '@/lib/api/tests';
import { fetchTestHistory, unlockResult } from '@/lib/api/progress';
import { unlockSpeakingReport } from '@/lib/api/speaking';
import { useAuthStore } from '@/stores/useAuthStore';
import type { DashboardStatsDTO, LessonDTO } from '@/lib/api/types';
import type { TestHistoryItem } from '@/lib/api/progress';

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, { icon: 'microphone' | 'book' | 'headphones' | 'pencil'; bg: string; fg: string }> = {
  speaking:  { icon: 'microphone', bg: 'rgba(216,226,255,0.5)', fg: colors.primary },
  reading:   { icon: 'book',       bg: 'rgba(111,251,190,0.3)', fg: colors.tertiary },
  listening: { icon: 'headphones', bg: 'rgba(255,219,202,0.5)', fg: colors.secondary },
  writing:   { icon: 'pencil',     bg: 'rgba(216,226,255,0.5)', fg: colors.primary },
};

type HistoryFilter = 'all' | 'mini' | 'full';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ item }: { item: TestHistoryItem }) {
  const isWriting = item.lesson_type === 'writing';
  const isPending = item.scoring_status === 'pending';
  if (isPending || item.score === null) return null;

  const score = isWriting ? (item.score ?? 0) : (item.total_questions > 0 ? Math.round((item.correct_answers / item.total_questions) * 100) : 0);
  const display = isWriting ? score.toFixed(1) : `${score}%`;
  const color = isWriting
    ? (score >= 7 ? colors.tertiary : score >= 5.5 ? colors.primary : colors.secondary)
    : (score >= 70 ? colors.tertiary : score >= 50 ? colors.primary : colors.secondary);

  return (
    <View style={[badge.wrap, { borderColor: color }]}>
      <Text style={[badge.text, { color }]}>{display}</Text>
      {isWriting && <Text style={[badge.sub, { color }]}>Band</Text>}
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, minWidth: 52, alignItems: 'center' },
  text: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sub: { fontSize: 9, fontWeight: '600', marginTop: -2 },
});

// ─── History Card ─────────────────────────────────────────────────────────────

interface HistoryCardProps {
  item: TestHistoryItem;
  index: number;
  onUnlock: (item: TestHistoryItem) => void;
  onPress: (item: TestHistoryItem) => void;
}

function HistoryCard({ item, onUnlock, onPress }: HistoryCardProps) {
  const type = (item.lesson_type || 'reading').toLowerCase();
  const iconDef = ICON_MAP[type] || ICON_MAP.reading;
  const isWriting = type === 'writing';
  const isPending = item.scoring_status === 'pending';
  const isFailed = item.scoring_status === 'failed';
  const typeLabel = item.test_type === 'mini' ? 'Mini' : item.test_type === 'full' ? 'Full' : 'Practice';
  const subLabel = isWriting
    ? typeLabel
    : `${typeLabel} · ${item.correct_answers}/${item.total_questions} câu`;

  return (
    <TouchableOpacity
      style={styles.historyCard}
      activeOpacity={0.75}
      onPress={() => onPress(item)}
      disabled={isPending}
    >
      <View style={[styles.historyIcon, { backgroundColor: iconDef.bg }]}>
        <FontAwesome name={iconDef.icon} size={18} color={iconDef.fg} />
      </View>

      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.lesson_title}</Text>
        <View style={styles.historyMeta}>
          <Text style={styles.historyMetaText}>{subLabel}</Text>
          <Text style={styles.historyDate}>{formatDate(item.completed_at)}</Text>
        </View>

        {isPending && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusPending}>Đang chấm điểm...</Text>
          </View>
        )}
        {isFailed && <Text style={styles.statusFailed}>⚠ Chấm điểm thất bại</Text>}
        {item.needs_unlock && !isPending && !isFailed && (
          <TouchableOpacity style={styles.unlockRow} onPress={() => onUnlock(item)}>
            <FontAwesome name="lock" size={11} color={colors.secondary} />
            <Text style={styles.unlockText}>Xem chi tiết — Xem 5s quảng cáo</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPending && !isFailed && <ScoreBadge item={item} />}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardStatsDTO | null>(null);
  const [tests, setTests] = useState<LessonDTO[]>([]);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [adTarget, setAdTarget] = useState<TestHistoryItem | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    getDashboard().then(setDashboard).catch(() => {});
    getTests().then(setTests).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadHistory = useCallback((filter: HistoryFilter) => {
    setHistoryLoading(true);
    fetchTestHistory({
      type: filter === 'all' ? undefined : filter,
      limit: 20,
    })
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => { loadHistory(historyFilter); }, [historyFilter]);

  const handleAdComplete = useCallback(async () => {
    if (!adTarget) return;
    const { kind, progress_id } = adTarget;
    setAdTarget(null);
    setUnlocking(true);
    try {
      if (kind === 'speaking') {
        await unlockSpeakingReport(progress_id);
      } else {
        await unlockResult(progress_id);
      }
      loadHistory(historyFilter);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể mở khóa kết quả. Vui lòng thử lại.');
    } finally {
      setUnlocking(false);
    }
  }, [adTarget, historyFilter, loadHistory]);

  const miniTests = tests.filter((t) => t.test_type === 'mini');
  const fullTests = tests.filter((t) => t.test_type === 'full');

  const completedHistory = history.filter((h) => h.scoring_status === 'completed' || h.scoring_status === 'none');
  const avgScore = completedHistory.length > 0
    ? Math.round(completedHistory.reduce((s, h) => s + (h.total_questions > 0 ? (h.correct_answers / h.total_questions) * 100 : 0), 0) / completedHistory.length)
    : null;

  const stats = [
    { value: avgScore !== null ? `${avgScore}%` : '—', label: 'Điểm TB', color: colors.primary },
    { value: history[0]?.completed_at ? formatDate(history[0].completed_at) : '—', label: 'Lần cuối', color: colors.secondary },
    { value: String(history.length), label: 'Đã làm', color: colors.tertiary },
  ];

  const testTypeLabel = (test: LessonDTO) => {
    const t = test.test_type || 'mini';
    const map: Record<string, string> = { mini: 'Mini Test', full: 'Full Test', practice: 'Practice' };
    return `${map[t] || 'Test'} • ${test.time_limit || 10} mins`;
  };

  return (
    <Screen>
      <AppHeader 
        title="Talko" 
        avatarUri={user?.avatar_url || undefined}
        avatarFrame={user?.avatar_frame}
        onLeaderboard={() => {}} 
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>Kiểm tra</Text>
          <Text style={styles.pageTitle}>Practice Tests</Text>
        </View>

        <StatsGrid items={stats} />

        {/* ── Danh sách bài test ── */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <>
            {miniTests.length > 0 && (
              <>
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Mini Tests</Text></View>
                {miniTests.map((test) => {
                  const iconDef = ICON_MAP[(test.lesson_type || 'reading').toLowerCase()] || ICON_MAP.reading;
                  // Use lesson_parts[0] for the initial part; fall back to legacy speaking_part
                  const firstPart = test.lesson_parts?.[0] ?? test.speaking_part ?? 1;
                  return (
                    <TestListItem key={test.id} icon={iconDef.icon} iconBgColor={iconDef.bg} iconColor={iconDef.fg}
                      title={test.title} subtitle={testTypeLabel(test)}
                      onPress={() => router.push(`/lesson/${test.id}?type=${test.lesson_type}&part=${firstPart}&testType=${test.test_type || 'mini'}`)}
                    />
                  );
                })}
              </>
            )}
            {fullTests.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: spacing.md }]}><Text style={styles.sectionTitle}>Full Tests</Text></View>
                {fullTests.map((test) => {
                  const iconDef = ICON_MAP[(test.lesson_type || 'reading').toLowerCase()] || ICON_MAP.reading;
                  // Use lesson_parts[0] for the initial part; fall back to legacy speaking_part
                  const firstPart = test.lesson_parts?.[0] ?? test.speaking_part ?? 1;
                  return (
                    <TestListItem key={test.id} icon={iconDef.icon} iconBgColor={iconDef.bg} iconColor={iconDef.fg}
                      title={test.title} subtitle={testTypeLabel(test)}
                      onPress={() => router.push(`/lesson/${test.id}?type=${test.lesson_type}&part=${firstPart}&testType=${test.test_type || 'mini'}`)}
                    />
                  );
                })}
              </>
            )}
            {tests.length === 0 && (
              <Text style={{ color: colors.textSecondary, paddingVertical: spacing.sm }}>No tests available yet.</Text>
            )}
          </>
        )}

        {/* ── Lịch sử ── */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Lịch sử</Text>
          <TouchableOpacity onPress={() => loadHistory(historyFilter)}>
            <FontAwesome name="refresh" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['all', 'mini', 'full'] as HistoryFilter[]).map((f) => (
            <TouchableOpacity key={f}
              style={[styles.filterChip, historyFilter === f && styles.filterChipActive]}
              onPress={() => setHistoryFilter(f)}
            >
              <Text style={[styles.filterChipText, historyFilter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'Tất cả' : f === 'mini' ? 'Mini' : 'Full'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {historyLoading || unlocking ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <FontAwesome name="history" size={32} color={colors.outlineVariant} />
            <Text style={styles.emptyHistoryText}>Chưa có bài kiểm tra nào</Text>
            <Text style={styles.emptyHistorySub}>Hoàn thành một bài test để xem lịch sử</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item, idx) => (
              <HistoryCard
                key={`${item.progress_id || item.lesson_id}-${idx}`}
                item={item}
                index={idx}
                onUnlock={(i) => setAdTarget(i)}
                onPress={(i) => {
                  // Block navigation if result is locked — redirect to unlock flow instead
                  if (i.needs_unlock) {
                    setAdTarget(i);
                    return;
                  }
                  router.push({
                    pathname: '/history/[progress_id]',
                    params: {
                      progress_id: i.progress_id,
                      lesson_id: i.lesson_id,
                      lesson_type: i.lesson_type || 'reading',
                      lesson_title: i.lesson_title,
                      needs_unlock: i.needs_unlock ? '1' : '0',
                    },
                  });
                }}
              />
            ))}
          </View>
        )}

        <PremiumCard
          title="Unlock Full Mock Tests"
          description="Get realistic exam conditions, detailed AI scoring, and instant feedback on all modules."
          buttonLabel="Go Pro Now"
          imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuAvdmA9LEeuw25BZpqp1go00liJwdujRW5UljVesp7-Et2iQ7iFXPproMF0mFBjbmssHj-CTljzJzDFubBE5MldPgVACnPyntAtZHjXgahD7gDZuY3lFsPKObbA4UNxS-dTkGi1MlpUzw40Qk29Sf_JaOeYWOqIvTj9F4-K8x2vNkMMucALq2N_R_m1VZ3QbQzLnhAbKSRWxnLShw5ruJPiukTxBKn8jYkFSw34ICrk7AE_v4xmVeSRDnDXdphDLCBzCdyLAANOdWo"
          onPress={() => {}}
        />
      </ScrollView>

      <FakeAdModal
        visible={!!adTarget}
        onComplete={handleAdComplete}
        onClose={() => setAdTarget(null)}
      />
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, gap: spacing.md },
  pageHeader: { gap: spacing.xs, marginBottom: spacing.sm },
  pageLabel: { fontSize: 12, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.outlineVariant, backgroundColor: colors.surface },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: colors.primary },
  emptyHistory: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.lg },
  emptyHistoryText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  emptyHistorySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
  historyList: { gap: spacing.sm },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  historyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyInfo: { flex: 1, gap: 3 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyMetaText: { fontSize: 12, color: colors.textSecondary },
  historyDate: { fontSize: 12, color: colors.textMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  statusPending: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  statusFailed: { fontSize: 12, color: colors.error, fontWeight: '600', marginTop: 2 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  unlockText: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
});
