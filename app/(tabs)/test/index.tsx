import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { TestListItem } from '@/components/ui/TestListItem';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { colors, spacing } from '@/theme/tokens';
import { getDashboard } from '@/lib/api/stats';
import { getTests } from '@/lib/api/tests';
import type { DashboardStatsDTO, LessonDTO } from '@/lib/api/types';

const ICON_MAP: Record<string, { icon: 'microphone' | 'book' | 'headphones' | 'pencil'; bg: string; fg: string }> = {
  speaking: { icon: 'microphone', bg: 'rgba(216,226,255,0.5)', fg: colors.primary },
  reading: { icon: 'book', bg: 'rgba(111,251,190,0.3)', fg: colors.tertiary },
  listening: { icon: 'headphones', bg: 'rgba(255,219,202,0.5)', fg: colors.secondary },
  writing: { icon: 'pencil', bg: 'rgba(216,226,255,0.5)', fg: colors.primary },
};

export default function TestScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardStatsDTO | null>(null);
  const [tests, setTests] = useState<LessonDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setDashboard).catch(() => {});
    getTests('mini').then(setTests).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = dashboard
    ? [
        { value: `${Math.round(dashboard.overall_progress_pct)}%`, label: 'Average Score', color: colors.primary },
        { value: '2d ago', label: 'Last Test', color: colors.secondary },
      ]
    : [
        { value: '...', label: 'Average Score', color: colors.primary },
        { value: '...', label: 'Last Test', color: colors.secondary },
      ];

  return (
    <Screen>
      <AppHeader title="IELTS Master" avatarLetter="U" onLeaderboard={() => {}} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>Kiểm tra</Text>
          <Text style={styles.pageTitle}>Practice Tests</Text>
        </View>
        <StatsGrid items={stats} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mini tests</Text>
          <Text style={styles.seeAll}>View All</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : tests.length > 0 ? (
          tests.map((test) => {
            const type = (test.lesson_type || 'reading').toLowerCase();
            const iconDef = ICON_MAP[type] || ICON_MAP.reading;
            const subtitle = `Mini Test • ${test.time_limit || 10} mins`;
            return (
              <TestListItem
                key={test.id}
                icon={iconDef.icon}
                iconBgColor={iconDef.bg}
                iconColor={iconDef.fg}
                title={test.title}
                subtitle={subtitle}
                onPress={() => router.push(`/lesson/${test.id}?type=${test.lesson_type}&part=${test.speaking_part || 1}&testType=${test.test_type || 'mini'}`)}
              />
            );
          })
        ) : (
          <Text style={{ color: colors.textSecondary, paddingVertical: spacing.sm }}>
            No mini tests available yet.
          </Text>
        )}
        <PremiumCard
          title="Unlock Full Mock Tests"
          description="Get realistic exam conditions, detailed AI scoring, and instant feedback on all modules."
          buttonLabel="Go Pro Now"
          imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuAvdmA9LEeuw25BZpqp1go00liJwdujRW5UljVesp7-Et2iQ7iFXPproMF0mFBjbmssHj-CTljzJzDFubBE5MldPgVACnPyntAtZHjXgahD7gDZuY3lFsPKObbA4UNxS-dTkGi1MlpUzw40Qk29Sf_JaOeYWOqIvTj9F4-K8x2vNkMMucALq2N_R_m1VZ3QbQzLnhAbKSRWxnLShw5ruJPiukTxBKn8jYkFSw34ICrk7AE_v4xmVeSRDnDXdphDLCBzCdyLAANOdWo"
          onPress={() => {}}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, gap: spacing.md },
  pageHeader: { gap: spacing.xs, marginBottom: spacing.sm },
  pageLabel: { fontSize: 12, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  seeAll: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
