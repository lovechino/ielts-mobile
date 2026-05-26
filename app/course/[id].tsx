import { View, ScrollView, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { useOfflineCourse } from '@/lib/offline/useOfflineCourse';
import { useDownloadStore } from '@/stores/useDownloadStore';

const ICON_MAP: Record<string, { icon: 'microphone' | 'book' | 'headphones' | 'pencil'; color: string }> = {
  speaking: { icon: 'microphone', color: colors.primary },
  reading: { icon: 'book', color: colors.tertiary },
  listening: { icon: 'headphones', color: colors.secondary },
  writing: { icon: 'pencil', color: colors.primary },
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { course, lessons, loading, offline, cached, error } = useOfflineCourse(id);
  const download = useDownloadStore((s) => s.downloads[id || '']);
  const downloadCourse = useDownloadStore((s) => s.downloadCourse);
  const remove = useDownloadStore((s) => s.remove);

  const handleDownload = () => { if (id) downloadCourse(id); };
  const handleDelete = () => { if (id) remove(id); };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!course) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Course not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{course.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <GlassCard style={styles.infoCard}>
        {course.description && (
          <Text style={styles.description}>{course.description}</Text>
        )}
        {course.level && (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{course.level}</Text>
            </View>
          </View>
        )}
      </GlassCard>

      <DownloadButton
        status={download?.status || 'idle'}
        sizeKb={download?.sizeKb}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {offline && (
        <View style={styles.offlineBanner}>
          <FontAwesome name="wifi" size={12} color="#fff" />
          <Text style={styles.offlineBannerText}>Đang xem nội dung đã tải</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Lessons</Text>

      {lessons.length === 0 ? (
        <Text style={styles.emptyText}>No lessons available yet.</Text>
      ) : (
        lessons
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((lesson) => {
            const lt = lesson.lesson_type?.toLowerCase() || '';
            const icon = ICON_MAP[lt] || { icon: 'book', color: colors.primary };
            return (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                activeOpacity={0.7}
                onPress={() => {
                  const params = new URLSearchParams({ type: lesson.lesson_type || '' });
                  if (lesson.speaking_part) params.set('part', String(lesson.speaking_part));
                  if (lesson.test_type) params.set('testType', lesson.test_type);
                  router.push(`/lesson/${lesson.id}?${params.toString()}`);
                }}
              >
                <View style={[styles.lessonIcon, { backgroundColor: icon.color + '20' }]}>
                  <FontAwesome name={icon.icon} size={20} color={icon.color} />
                </View>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonType}>{lesson.lesson_type || 'General'}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.outline} />
              </TouchableOpacity>
            );
          })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: colors.textSecondary },
  backLink: { marginTop: spacing.md },
  backLinkText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  infoCard: { marginBottom: spacing.lg },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.xs },
  badge: { backgroundColor: colors.primary + '15', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary, paddingVertical: spacing.xl, textAlign: 'center' },
  lessonCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    ...shadow.card,
  },
  lessonIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  lessonType: { fontSize: 12, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.secondary, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
    marginBottom: spacing.sm, alignSelf: 'flex-start',
  },
  offlineBannerText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
