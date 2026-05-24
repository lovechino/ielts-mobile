import { View, ScrollView, Text, StyleSheet, ActivityIndicator, TextInput, Switch, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { LearningModeCard } from '@/components/ui/LearningModeCard';
import { fetchVocabulary, updateVocabProgress } from '@/lib/api/vocabulary';
import type { VocabularyDTO } from '@/lib/api/types';
import * as Speech from 'expo-speech';

const QUANTITY_OPTIONS = [10, 20, 50];
const ORDER_OPTIONS = [
  { value: 'random', label: 'Ngẫu nhiên', icon: 'random' as const },
  { value: 'ordered', label: 'Theo thứ tự', icon: 'sort-amount-asc' as const },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unlearned', label: 'Chưa thuộc' },
  { value: 'learned', label: 'Đã thuộc' },
];

const MODES = [
  {
    id: 'flashcard', title: 'Flashcard', subtitle: 'Lật thẻ để học từ vựng', coins: 5,
    icon: <FontAwesome name="bars" size={16} color="#fff" />, bg: '#6366f1',
  },
  {
    id: 'quiz', title: 'Quiz', subtitle: 'Trắc nghiệm chọn đáp án...', coins: 10,
    icon: <FontAwesome name="file-text-o" size={16} color="#fff" />, bg: '#f97316',
  },
  {
    id: 'listening', title: 'Listening', subtitle: 'Nghe từ và gõ lại (30s)', coins: 15,
    icon: <FontAwesome name="volume-up" size={16} color="#fff" />, bg: '#06b6d4',
  },
  {
    id: 'typing', title: 'Typing', subtitle: 'Xem nghĩa, gõ từ tiếng A...', coins: 10,
    icon: <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>T</Text>, bg: '#65a30d',
  },
  {
    id: 'matching', title: 'Ghép cặp', subtitle: 'Nối từ với nghĩa',
    icon: <FontAwesome name="th-large" size={16} color="#fff" />, bg: '#3b82f6',
  },
  {
    id: 'combined', title: 'Tổng hợp', subtitle: 'Kết hợp nhiều chế độ',
    icon: <FontAwesome name="arrows" size={16} color="#fff" />, bg: '#ec4899',
    badge: 'HOT 🔥',
  },
];

export default function VocabWordsScreen() {
  const { courseId, groupBy, groupValue } = useLocalSearchParams<{
    courseId: string;
    groupBy: string;
    groupValue: string;
  }>();
  const router = useRouter();

  const [allWords, setAllWords] = useState<VocabularyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quantity, setQuantity] = useState(10);
  const [order, setOrder] = useState('random');
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!courseId) return;
    const params: any = { course_id: courseId };
    if (groupBy && groupValue) params[groupBy] = groupValue;
    fetchVocabulary(params)
      .then(setAllWords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, groupBy, groupValue]);

  const filteredWords = useMemo(() => {
    let list = [...allWords];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((w) => w.word.toLowerCase().includes(q) || (w.definition_vi || '').toLowerCase().includes(q));
    }

    if (statusFilter === 'learned') list = list.filter((w) => learnedIds.has(w.id));
    else if (statusFilter === 'unlearned') list = list.filter((w) => !learnedIds.has(w.id));

    if (order === 'random') list.sort(() => Math.random() - 0.5);
    else list.sort((a, b) => a.word.localeCompare(b.word));

    return list;
  }, [allWords, searchQuery, statusFilter, order, learnedIds]);

  const visibleWords = filteredWords.slice(0, displayCount);
  const totalCount = allWords.length;
  const learnedCount = learnedIds.size;

  const handleToggleLearned = useCallback(async (wordId: string, value: boolean) => {
    setToggling((prev) => new Set(prev).add(wordId));
    const status = value ? 'learned' : 'seen';
    try {
      await updateVocabProgress(wordId, { status });
      setLearnedIds((prev) => {
        const next = new Set(prev);
        if (value) next.add(wordId);
        else next.delete(wordId);
        return next;
      });
    } catch { }
    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  }, []);

  const handleModePress = (modeId: string) => {
    router.push(`/vocabulary/minigame?mode=${modeId}&courseId=${courseId}&groupBy=${groupBy || ''}&groupValue=${encodeURIComponent(groupValue || '')}`);
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerTitle}>Tùy chỉnh</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{learnedCount}/{totalCount} từ</Text>
          </View>
        </View>

        <View style={styles.filterGrid}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Trạng thái</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={() => {
              const idx = STATUS_OPTIONS.findIndex((o) => o.value === statusFilter);
              setStatusFilter(STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length].value);
            }}>
              <Text style={styles.filterSelectIcon}>📖</Text>
              <Text style={styles.filterSelectText}>{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}</Text>
              <FontAwesome name="chevron-down" size={12} color={colors.outline} />
            </TouchableOpacity>
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Số lượng</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={() => {
              const idx = QUANTITY_OPTIONS.indexOf(quantity);
              setQuantity(QUANTITY_OPTIONS[(idx + 1) % QUANTITY_OPTIONS.length]);
              setDisplayCount(QUANTITY_OPTIONS[(idx + 1) % QUANTITY_OPTIONS.length]);
            }}>
              <Text style={styles.filterSelectIcon}>🔢</Text>
              <Text style={styles.filterSelectText}>{quantity} từ</Text>
              <FontAwesome name="chevron-down" size={12} color={colors.outline} />
            </TouchableOpacity>
          </View>
          <View style={{ width: '100%' }}>
            <Text style={styles.filterLabel}>Thứ tự</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={() => {
              setOrder((prev) => prev === 'random' ? 'ordered' : 'random');
            }}>
              <Text style={styles.filterSelectIcon}>🔀</Text>
              <Text style={styles.filterSelectText}>{ORDER_OPTIONS.find((o) => o.value === order)?.label}</Text>
              <FontAwesome name="chevron-down" size={12} color={colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modesSection}>
          <View style={styles.modesHeader}>
            <Text style={styles.sectionTitle}>Chọn chế độ học</Text>
            <TouchableOpacity>
              <FontAwesome name="cog" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modesGrid}>
            {MODES.map((mode) => (
              <LearningModeCard
                key={mode.id}
                title={mode.title}
                subtitle={mode.subtitle}
                icon={mode.icon}
                coins={mode.coins}
                badge={mode.badge}
                bgColor={mode.bg}
                onPress={() => handleModePress(mode.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Danh sách từ vựng</Text>
            <Text style={styles.listTotal}>{totalCount} từ</Text>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <FontAwesome name="search" size={14} color={colors.outline} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm từ vựng..."
                placeholderTextColor={colors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterChip} onPress={() => {
              const idx = STATUS_OPTIONS.findIndex((o) => o.value === statusFilter);
              setStatusFilter(STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length].value);
            }}>
              <Text style={styles.filterChipText}>{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Từ vựng</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Nghĩa</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Thuộc</Text>
            </View>
            {visibleWords.map((w) => (
              <View key={w.id} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <View style={styles.wordCell}>
                    <TouchableOpacity onPress={() => Speech.speak(w.word, { language: 'en' })}>
                      <FontAwesome name="volume-up" size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.wordText}>{w.word}</Text>
                      {w.pronunciation && <Text style={styles.pronunciation}>{w.pronunciation}</Text>}
                    </View>
                  </View>
                </View>
                <Text style={[styles.meaningText, { flex: 1.5 }]}>{w.definition_vi || w.definition || ''}</Text>
                <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                  <Switch
                    value={learnedIds.has(w.id)}
                    onValueChange={(val) => handleToggleLearned(w.id, val)}
                    trackColor={{ false: '#ccc', true: colors.primary }}
                    thumbColor="#fff"
                    disabled={toggling.has(w.id)}
                  />
                </View>
              </View>
            ))}
          </View>

          {displayCount < filteredWords.length && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setDisplayCount((prev) => Math.min(prev + 20, filteredWords.length))}
            >
              <Text style={styles.showMoreText}>Xem thêm từ vựng</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  progressBadge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
  },
  progressText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  filterGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  filterCol: { width: '48%' },
  filterLabel: {
    fontSize: 10, fontWeight: '700', color: colors.outline,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs,
  },
  filterSelect: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.sm, padding: spacing.sm,
  },
  filterSelectIcon: { fontSize: 14 },
  filterSelectText: { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1 },

  modesSection: { gap: spacing.md },
  modesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  listSection: { gap: spacing.md },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTotal: { fontSize: 12, color: colors.outline },

  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchInputWrap: {
    flex: 1, position: 'relative',
    backgroundColor: colors.surfaceContainerLow, borderRadius: radius.pill,
  },
  searchIcon: { position: 'absolute', left: spacing.sm, top: 10, zIndex: 1 },
  searchInput: {
    paddingLeft: 32, paddingRight: spacing.sm, paddingVertical: spacing.sm,
    fontSize: 13, color: colors.text, borderRadius: radius.pill,
  },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLow, borderRadius: radius.pill,
    justifyContent: 'center',
  },
  filterChipText: { fontSize: 13, color: colors.text, fontWeight: '500' },

  table: {
    backgroundColor: '#fff', borderRadius: radius.sm, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  tableHeaderCell: {
    fontSize: 10, fontWeight: '700', color: colors.outline,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerLow,
  },
  wordCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wordText: { fontSize: 14, fontWeight: '700', color: colors.text },
  pronunciation: { fontSize: 10, color: colors.outline },
  meaningText: { fontSize: 13, color: colors.textSecondary },

  showMoreBtn: {
    paddingVertical: spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill,
  },
  showMoreText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
