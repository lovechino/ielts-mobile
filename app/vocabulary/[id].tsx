import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { fetchVocabulary } from '@/lib/api/vocabulary';
import type { VocabularyDTO } from '@/lib/api/types';

interface VocabGroup {
  label: string;
  value: string;
  count: number;
}

export default function VocabGroupsScreen() {
  const { id, structureType } = useLocalSearchParams<{ id: string; structureType?: string }>();
  const router = useRouter();
  const [words, setWords] = useState<VocabularyDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchVocabulary({ course_id: id })
      .then(setWords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const groups: VocabGroup[] = useMemo(() => {
    if (!words.length) return [];
    const isCefr = structureType === 'cefr_levels';
    const field = isCefr ? 'level' : 'topic';
    const map = new Map<string, number>();
    for (const w of words) {
      const key = (w as any)[field];
      if (key) map.set(key, (map.get(key) || 0) + 1);
    }
    const order = isCefr
      ? ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      : [];
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

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài học</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {groups.length === 0 && (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
            No lessons available.
          </Text>
        )}
        {groups.map((g) => (
          <TouchableOpacity key={g.value} style={styles.groupCard} onPress={() => handleGroupPress(g)} activeOpacity={0.7}>
            <View style={styles.groupInfo}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <Text style={styles.groupCount}>{g.count} từ</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={colors.outline} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.sm },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  groupInfo: { gap: spacing.unit },
  groupLabel: { fontSize: 17, fontWeight: '600', color: colors.text },
  groupCount: { fontSize: 13, color: colors.textSecondary },
});
