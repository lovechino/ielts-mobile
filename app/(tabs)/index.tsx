import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { CourseCardProgress } from '@/components/ui/CourseCardProgress';
import { CourseCardDetail } from '@/components/ui/CourseCardDetail';
import { colors, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { getDashboard } from '@/lib/api/stats';
import { fetchCourses } from '@/lib/api/courses';
import type { DashboardStatsDTO } from '@/lib/api/types';
import type { CourseDTO } from '@/lib/api/types';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const streak = useStreakStore((s) => s.streakCount);
  const fetchStreak = useStreakStore((s) => s.fetchStreak);
  const recordActivity = useStreakStore((s) => s.recordActivity);
  const [dashboard, setDashboard] = useState<DashboardStatsDTO | null>(null);
  const [courses, setCourses] = useState<CourseDTO[]>([]);

  useEffect(() => {
    fetchStreak();
    recordActivity();
    getDashboard().then(setDashboard).catch(() => {});
    fetchCourses().then(setCourses).catch(() => {});
  }, []);

  const stats = dashboard
    ? [
        { value: String(dashboard.total_vocab), label: 'Tổng từ', color: colors.tertiary },
        { value: String(dashboard.vocab_learned), label: 'Đã thuộc', color: colors.secondary },
        { value: `${dashboard.overall_progress_pct}%`, label: 'Tiến độ', color: colors.primary },
        { value: '0', label: 'Ví xu' },
      ]
    : [
        { value: '...', label: 'Tổng từ' },
        { value: '...', label: 'Đã thuộc' },
        { value: '...', label: 'Tiến độ' },
        { value: '...', label: 'Ví xu' },
      ];

  const ongoingCourses = courses.slice(0, 2);
  const courseColors = [colors.primary, colors.tertiary];

  return (
    <Screen>
      <AppHeader
        title="Peak"
        avatarLetter={user?.full_name?.charAt(0)?.toUpperCase()}
        streak={streak}
        coins={0}
        onLeaderboard={() => {}}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.greeting}>
          <View style={styles.greetingBg} />
          <View style={styles.greetingRow}>
            <View style={styles.mascot}>
              <Text style={styles.mascotText}>🦉</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingName}>Hi {user?.full_name || 'Learner'}!</Text>
              <Text style={styles.greetingText}>Hôm nay bạn siêu chăm chỉ, cùng giữ chuỗi ngày học nhé!</Text>
            </View>
          </View>
        </GlassCard>
        <StatsGrid items={stats} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khóa học đang học</Text>
        </View>
        {ongoingCourses.length > 0 ? (
          ongoingCourses.map((c, idx) => (
            <CourseCardProgress
              key={c.id}
              title={c.title}
              progress={0}
              borderColor={courseColors[idx] || colors.primary}
              onPress={() => router.push(`/course/${c.id}`)}
            />
          ))
        ) : (
          <Text style={{ color: colors.textSecondary, paddingVertical: spacing.sm }}>
            Chưa có khóa học nào. Hãy khám phá các khóa học bên dưới!
          </Text>
        )}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khóa học hiện có</Text>
        </View>
        <CourseCardDetail
          imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuBIyOvA3aVa080hG5QsGObgghLyXxXWLtQApUihF5eVN8ulDvj1N_WN_tkh890Hsd3-csKfE0zjX_rijyMgObBMdSvqQwdVp_gKrf6TELfOoB498ZDZhYl5wX1ZTduOhA7ifIqOP4Vdr3tsxZqI5rmjmMrcXMhqWrfKEYJv2Zyg8L6yAy3gj0F7eivrwD6ysP5jFjhPXXDsvKCTqQWoT9HVxbxYWgrQmyBRvZaEF1Qw_tm5lojEdeAMbqglzygLi24tg0HULEqt6wA"
          badgeLabel="Best Seller"
          title="IELTS Speaking & Writing Expert"
          description="Deep dive into complex structures and high-level vocabulary for Band 8.0 mastery with certified examiners."
          buttonLabel="View details"
          onPress={() => router.push('/course/3')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, gap: spacing.md },
  greeting: { position: 'relative', overflow: 'hidden', borderColor: 'rgba(255,183,144,0.2)' },
  greetingBg: {
    position: 'absolute', right: -16, top: -16, width: 96, height: 96,
    borderRadius: 48, backgroundColor: 'rgba(253,118,26,0.05)',
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mascot: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(253,118,26,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  mascotText: { fontSize: 36 },
  greetingName: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  greetingText: { fontSize: 14, color: colors.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
});
