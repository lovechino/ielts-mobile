import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { HeroImage } from '@/components/ui/HeroImage';
import { colors, spacing, radius } from '@/theme/tokens';
import { fetchVocabularyCourses } from '@/lib/api/vocabulary';
import { getStreak } from '@/lib/api/stats';
import type { VocabularyCourseDTO } from '@/lib/api/types';

export default function MaterialScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<VocabularyCourseDTO[]>([]);
  const [streak, setStreak] = useState(0);
  const [wordsToday, setWordsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVocabularyCourses().then(setCourses).catch(() => {});
    getStreak()
      .then((s) => {
        setStreak(s.current_streak);
        setWordsToday(Math.min(s.current_streak * 2, 12));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen>
      <AppHeader title="Peak" avatarLetter="U" onLeaderboard={() => {}} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>Tài liệu</Text>
          <Text style={styles.pageTitle}>Vocabulary Vault</Text>
          <Text style={styles.pageSub}>Khám phá kho từ vựng phong phú được cá nhân hóa cho nhu cầu học tập của bạn</Text>
        </View>
        <HeroImage
          uri="https://lh3.googleusercontent.com/aida-public/AB6AXuB4RFIocALneuB76QeaGI8HjcvljxdK1MXEcmj2SZOQrCBdHOgio0scO1aisKDRZef9i75DRsLTlY2EXm3VvqahVDlecARjIenabfPt7js19NXyxG_GtflnFEAtVXoIo06XJjx3han7HdEvTk715oI1y5ksmmgOzjSoEwmmv9Yl67A5WUlUddQArZTcTRT4GVeMi0ktOkKrRVhsSU9FjOk8y6kkHe7MSVOZu-T6LuXN1-Ajxq0zm9DhfP-f7crl-0sdAzTR-x2pgD8"
          badgeLabel="New Mastery Pack"
          title="Advanced Academic Phrases"
        />
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          courses.map((vc) => (
            <GlassCard
              key={vc.id}
              borderLeft={vc.structure_type === 'cefr_levels' ? colors.primary : colors.secondary}
              style={styles.courseCard}
            >
              <View style={styles.courseTag}>
                <Text style={styles.courseTagText}>{vc.structure_type === 'cefr_levels' ? 'CEFR LEVELS' : 'DIRECT TOPICS'}</Text>
              </View>
              <Text style={styles.courseTitle}>{vc.title}</Text>
              {vc.description ? <Text style={styles.courseDesc}>{vc.description}</Text> : null}
              <View style={styles.divider} />
              <TouchableOpacity style={styles.startBtn} onPress={() => router.push(`/vocabulary/${vc.id}?structureType=${vc.structure_type}`)}>
                <Text style={styles.startBtnText}>Bắt đầu học ngay</Text>
                <FontAwesome name="arrow-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
        <View style={styles.streakCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>Daily Streak</Text>
            <Text style={styles.streakSub}>You've mastered {wordsToday} words today!</Text>
          </View>
          <View style={styles.streakIcon}>
            <FontAwesome name="fire" size={24} color="#fff" />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, gap: spacing.md },
  pageHeader: { gap: spacing.xs, marginBottom: spacing.sm },
  pageLabel: { fontSize: 12, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSecondary },
  courseCard: { padding: spacing.lg },
  courseTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  courseTagText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  courseTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  courseDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: 'rgba(194,198,214,0.3)', marginBottom: spacing.md },
  startBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: spacing.sm },
  startBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primaryContainer, borderRadius: radius.lg,
    padding: spacing.lg,
  },
  streakTitle: { fontSize: 20, fontWeight: '600', color: '#fff' },
  streakSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  streakIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
});
