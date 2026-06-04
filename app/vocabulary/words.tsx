import { View, ScrollView, Text, StyleSheet, ActivityIndicator, TextInput, Switch, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { LearningModeCard } from '@/components/ui/LearningModeCard';
import { colors, spacing, radius } from '@/theme/tokens';
import { getAllVaultWords, getRandomWords, toggleMasteredStatus, getWordsByLevel, getWordsByTopic } from '@/lib/offline/dictionary';
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
const LEVEL_OPTIONS = [
  { value: 'all', label: 'Mọi trình độ' },
  { value: 'A1', label: 'Level A1' },
  { value: 'A2', label: 'Level A2' },
  { value: 'B1', label: 'Level B1' },
  { value: 'B2', label: 'Level B2' },
  { value: 'C1', label: 'Level C1' },
  { value: 'C2', label: 'Level C2' },
];

const getLevelColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'A1': return '#4cd137';
    case 'A2': return '#44bd32';
    case 'B1': return '#fbc531';
    case 'B2': return '#e1b12c';
    case 'C1': return '#e84118';
    case 'C2': return '#c23616';
    default: return colors.outline;
  }
};

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

  const [displayCount, setDisplayCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [academicOnly, setAcademicOnly] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [order, setOrder] = useState('random');
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [courseId, groupBy, groupValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      let wordList: any[] = [];
      if (groupBy === 'group_name' && groupValue) {
        wordList = await getAllVaultWords(groupValue);
      } else if (groupBy === 'topic' && groupValue) {
        wordList = await getWordsByTopic(groupValue, 100);
      } else if (groupBy === 'level' && groupValue) {
        wordList = await getWordsByLevel(groupValue, 100);
      } else {
        wordList = await getRandomWords(100); // Tăng lên 100 từ để lọc cho sướng
      }
      setWords(wordList);
      
      const learned = new Set(wordList.filter(w => w.status === 'mastered').map(w => String(w.id)));
      setLearnedIds(learned as Set<string>);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLearned = useCallback(async (wordId: number) => {
    // Optimistic UI Update
    setLearnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(wordId))) next.delete(String(wordId));
      else next.add(String(wordId));
      return next;
    });

    try {
      await toggleMasteredStatus(wordId);
    } catch (e) {
      // Rollback on error
      setLearnedIds((prev) => {
        const next = new Set(prev);
        if (next.has(String(wordId))) next.delete(String(wordId));
        else next.add(String(wordId));
        return next;
      });
      console.error(e);
    }
  }, []);

  const filteredWords = useMemo(() => {
    let list = [...words];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((w) => w.word.toLowerCase().includes(q) || (w.definition_vi || '').toLowerCase().includes(q));
    }

    if (statusFilter === 'learned') list = list.filter((w) => learnedIds.has(String(w.id)));
    else if (statusFilter === 'unlearned') list = list.filter((w) => !learnedIds.has(String(w.id)));

    if (levelFilter !== 'all') list = list.filter((w) => w.level === levelFilter);
    if (academicOnly) list = list.filter((w) => w.is_academic === 1);

    if (order === 'random') list.sort(() => Math.random() - 0.5);
    else list.sort((a, b) => a.word.localeCompare(b.word));

    return list;
  }, [words, searchQuery, statusFilter, levelFilter, academicOnly, order, learnedIds]);

  const visibleWords = filteredWords.slice(0, displayCount);
  const totalCount = words.length;
  const filteredCount = filteredWords.length;
  const learnedCount = learnedIds.size;

  const handleModePress = (modeId: string) => {
    router.push(`/vocabulary/minigame?mode=${modeId}&courseId=${courseId || ''}&groupBy=${groupBy || ''}&groupValue=${encodeURIComponent(groupValue || '')}`);
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
          <Text style={styles.headerTitle}>{groupValue || 'Lộ trình'}</Text>
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
            <Text style={styles.filterLabel}>Trình độ</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={() => {
              const idx = LEVEL_OPTIONS.findIndex((o) => o.value === levelFilter);
              setLevelFilter(LEVEL_OPTIONS[(idx + 1) % LEVEL_OPTIONS.length].value);
            }}>
              <Text style={styles.filterSelectIcon}>📊</Text>
              <Text style={styles.filterSelectText}>{LEVEL_OPTIONS.find((o) => o.value === levelFilter)?.label}</Text>
              <FontAwesome name="chevron-down" size={12} color={colors.outline} />
            </TouchableOpacity>
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Học thuật</Text>
            <TouchableOpacity 
              style={[styles.filterSelect, academicOnly && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} 
              onPress={() => setAcademicOnly(!academicOnly)}
            >
              <FontAwesome name="graduation-cap" size={14} color={academicOnly ? colors.primary : colors.outline} />
              <Text style={[styles.filterSelectText, academicOnly && { color: colors.primary, fontWeight: '700' }]}>IELTS</Text>
              <Switch 
                value={academicOnly} 
                onValueChange={setAcademicOnly} 
                trackColor={{ false: '#eee', true: colors.primary + '50' }}
                thumbColor={academicOnly ? colors.primary : '#ccc'}
                style={{ transform: [{ scaleX: 0.6 }, { scaleY: 0.6 }], marginRight: -8 }}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.filterCol}>
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
            <Text style={styles.listTotal}>{filteredCount} / {totalCount} từ</Text>
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
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Từ vựng</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Nghĩa</Text>
              <Text style={[styles.tableHeaderCell, { width: 40, textAlign: 'right' }]}>OK</Text>
            </View>
            {visibleWords.map((w) => (
              <TouchableOpacity 
                key={w.id} 
                style={styles.tableRow}
                onPress={() => router.push(`/vocabulary/${w.id}`)}
              >
                <View style={{ flex: 2 }}>
                  <View style={styles.wordCell}>
                    <TouchableOpacity onPress={() => Speech.speak(w.word, { language: 'en' })}>
                      <FontAwesome name="volume-up" size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.wordText}>{w.word}</Text>
                        {w.level && (
                          <View style={[styles.levelBadgeMini, { backgroundColor: getLevelColor(w.level) }]}>
                            <Text style={styles.levelBadgeTextMini}>{w.level}</Text>
                          </View>
                        )}
                        {w.is_academic === 1 && (
                          <FontAwesome name="graduation-cap" size={10} color={colors.outline} />
                        )}
                      </View>
                      {w.pronunciation && <Text style={styles.pronunciation}>{w.pronunciation}</Text>}
                    </View>
                  </View>
                </View>
                <Text style={[styles.meaningText, { flex: 1.5 }]}>{w.definition_vi || w.definition || ''}</Text>
                <TouchableOpacity 
                  style={{ width: 40, alignItems: 'flex-end' }}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleLearned(w.id);
                  }}
                >
                  <FontAwesome 
                    name={learnedIds.has(String(w.id)) ? "check-circle" : "circle-o"} 
                    size={20} 
                    color={learnedIds.has(String(w.id)) ? "#27ae60" : colors.border} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
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
  levelBadgeMini: { paddingHorizontal: 4, height: 14, borderRadius: 3, justifyContent: 'center' },
  levelBadgeTextMini: { color: '#fff', fontSize: 8, fontWeight: '800' },
  pronunciation: { fontSize: 10, color: colors.outline },
  meaningText: { fontSize: 13, color: colors.textSecondary },

  showMoreBtn: {
    paddingVertical: spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill,
  },
  showMoreText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
