import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { colors, spacing, radius } from '@/theme/tokens';
import { useOfflineVocab } from '@/lib/offline/useOfflineVocab';
import { useDownloadStore } from '@/stores/useDownloadStore';
import type { VocabularyDTO } from '@/lib/api/types';

const VALID_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface VocabGroup {
  label: string;
  value: string;
  count: number;
}

export default function VocabGroupsScreen() {
  const { id, structureType } = useLocalSearchParams<{ id: string; structureType?: string }>();
  const router = useRouter();
  const { words, loading, offline, error } = useOfflineVocab({ vocab_course_id: id || '', structure_type: structureType });
  const download = useDownloadStore((s) => s.downloads[`voc:${id}`]);
  const downloadVocab = useDownloadStore((s) => s.downloadVocab);
  const remove = useDownloadStore((s) => s.remove);

  const isWeb = Platform.OS === 'web';
  const handleDownload = () => { if (id) downloadVocab(id); };
  const handleDelete = () => { if (id) remove(`voc:${id}`); };

  const groups: VocabGroup[] = useMemo(() => {
    if (!words.length) return [];
    const isCefr = structureType === 'cefr_levels';
    const field = isCefr ? 'level' : 'topic';
    const map = new Map<string, number>();
    for (const w of words) {
      const key = (w as any)[field];
      if (!key) continue;
      if (isCefr && !VALID_CEFR_LEVELS.includes(key)) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    const order = isCefr ? VALID_CEFR_LEVELS : [];
    return Array.from(map.entries())
      .map(([value, count]) => ({ label: isCefr ? `CEFR ${value}` : value, value, count }))
      .sort((a, b) => {
        if (isCefr) return order.indexOf(a.value) - order.indexOf(b.value);
        return a.label.localeCompare(b.label);
      });
  }, [words, structureType]);

  const handleGroupPress = (g: VocabGroup) => {
    const groupBy = structureType === 'cefr_levels' ? 'level' : 'topic';
    router.push(`/vocabulary/words?courseId=${id}&groupBy=${groupBy}&groupValue=${encodeURIComponent(g.value)}`);
  };

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error && !groups.length) {
    return (
      <Screen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bài học</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }}>{error}</Text>
          {!isWeb && (
            <DownloadButton
              status={download?.status || 'idle'}
              sizeKb={download?.sizeKb}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.xs }}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài học</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Lộ trình học tập</Text>
          <Text style={styles.heroSub}>Chọn cấp độ phù hợp để bắt đầu hành trình chinh phục IELTS.</Text>
          {!isWeb && (
            <DownloadButton
              status={download?.status || 'idle'}
              sizeKb={download?.sizeKb}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          )}
        </View>

        {offline && (
          <View style={styles.offlineBanner}>
            <FontAwesome name="wifi" size={12} color="#fff" />
            <Text style={styles.offlineBannerText}>Đang xem nội dung đã tải</Text>
          </View>
        )}

        {groups.length === 0 && (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
            No lessons available.
          </Text>
        )}

        <View style={styles.cardList}>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={styles.groupCard}
              onPress={() => handleGroupPress(g)}
              activeOpacity={0.7}
            >
              <View style={styles.groupCardLeft}>
                <View style={styles.levelBox}>
                  <Text style={styles.levelBoxText}>{g.value}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupLabel}>{g.label}</Text>
                  <Text style={styles.groupCount}>{g.count} từ vựng</Text>
                </View>
              </View>
              <FontAwesome name="chevron-right" size={18} color={colors.outlineVariant} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.unit * 10, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  hero: { gap: spacing.xs, marginBottom: spacing.xs },
  heroTitle: { fontSize: 28, fontWeight: '700', color: colors.text, lineHeight: 36 },
  heroSub: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.sm },

  cardList: { gap: spacing.md },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.xl2, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.outlineVariant, borderLeftWidth: 4, borderLeftColor: colors.outlineVariant,
  },
  groupCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBox: {
    width: 56, height: 56,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  levelBoxText: { fontSize: 18, fontWeight: '700', color: colors.onSurfaceVariant },
  groupInfo: { gap: spacing.unit },
  groupLabel: { fontSize: 20, fontWeight: '600', color: colors.text, lineHeight: 28 },
  groupCount: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.secondary, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
    alignSelf: 'flex-start',
  },
  offlineBannerText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
