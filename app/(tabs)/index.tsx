import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { DailyChallengeWidget } from '@/components/ui/DailyChallengeWidget';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { FontAwesome } from '@expo/vector-icons';
import { getMasteredCount, getVaultGroups, getSystemVocabStats, getTotalWordCount, initDictionaryDB } from '@/lib/offline/dictionary';

interface VocabPath {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  count: number;
  learned: number;
  isCustom?: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const user = useAuthStore((s) => s.user);
  const authState = useAuthStore((s) => s.authState);
  const streak = useStreakStore((s) => s.streakCount);
  const fetchStreak = useStreakStore((s) => s.fetchStreak);
  const recordActivity = useStreakStore((s) => s.recordActivity);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [paths, setPaths] = useState<VocabPath[]>([]);
  const lastLoadRef = useRef<number>(0);

  useEffect(() => {
    if (isFocused && authState === 'authenticated') {
      const now = Date.now();
      // Chỉ load lại nếu đã quá 5 giây kể từ lần load cuối (Tránh spam khi switch tab)
      if (now - lastLoadRef.current > 5000) {
        console.log('[Home] Refreshing data...');
        fetchStreak().catch(console.error);
        recordActivity().catch(console.error);
        loadData();
        lastLoadRef.current = now;
      }
    }
  }, [isFocused, authState]);

  const loadData = async () => {
    try {
      // Đảm bảo DB đã sẵn sàng
      await initDictionaryDB();
      
      const [mCount, systemStats, userGroups, total] = await Promise.all([
        getMasteredCount(),
        getSystemVocabStats(),
        getVaultGroups(),
        getTotalWordCount(),
      ]);
      
      setMasteredCount(mCount);
      setTotalWords(total);

      // 1. Chuyển đổi systemStats (IELTS, TOEIC...)
      const systemPaths: VocabPath[] = systemStats.map(s => ({
        id: s.topic,
        title: s.topic,
        subtitle: 'Lộ trình hệ thống',
        icon: s.topic.toLowerCase().includes('ielts') ? 'graduation-cap' : 'book',
        color: s.topic.toLowerCase().includes('ielts') ? '#6C5CE7' : '#00B894',
        count: s.count,
        learned: 0, // Cần logic đếm chi tiết sau
      }));

      // 2. Chuyển đổi userGroups (Lộ trình cá nhân)
      const customPaths: VocabPath[] = userGroups.map(g => ({
        id: g.group_name,
        title: g.group_name,
        subtitle: 'Lộ trình của bạn',
        icon: 'user',
        color: '#E84393',
        count: g.count,
        learned: 0,
        isCustom: true
      }));

      setPaths([...systemPaths, ...customPaths]);
    } catch (e) {
      console.error(e);
    }
  };

  const formatWordCount = (n: number) =>
    n === 0 ? '—' : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);

  const stats = [
    { value: formatWordCount(totalWords), label: 'Tổng từ', color: colors.primary, onPress: () => router.push('/vocabulary/words') },
    { value: String(masteredCount), label: 'Đã thuộc', color: colors.secondary, onPress: () => router.push('/vocabulary/vault') },
    { value: String(streak), label: 'Streak', color: '#FF7675' },
    { value: String(user?.coins || 0), label: 'Ví xu', color: '#FDCB6E', onPress: () => router.push('/shop') },
  ];

  return (
    <Screen>
      <AppHeader
        title="IELTS Hub"
        avatarLetter={user?.full_name?.charAt(0)?.toUpperCase()}
        streak={streak}
        coins={user?.coins || 0}
        onLeaderboard={() => {}}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>Chào {user?.full_name?.split(' ')[0] || 'bạn'},</Text>
            <Text style={styles.subGreeting}>Hôm nay bạn muốn luyện gì?</Text>
          </View>
          <View style={styles.xpBadge}>
            <FontAwesome name="bolt" size={14} color="#FDCB6E" />
            <Text style={styles.xpText}>{(user as any)?.xp || 0} XP</Text>
          </View>
        </GlassCard>

        <StatsGrid items={stats} />

        <DailyChallengeWidget />

        <View style={styles.section}>
          <SectionHeader title="Trò chơi trí tuệ" rightLabel="Xem tất cả →" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameScroll}>
            <TouchableOpacity 
              style={[styles.gameCard, { backgroundColor: '#EDE9FF' }]}
              onPress={() => router.push('/vocabulary/flashcard')}
            >
              <View style={[styles.gameIcon, { backgroundColor: '#6C5CE7' }]}>
                <FontAwesome name="clone" size={18} color="#fff" />
              </View>
              <Text style={styles.gameTitle}>Flashcard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.gameCard, { backgroundColor: '#E8F5E9' }]}
              onPress={() => router.push('/vocabulary/practice?type=match')}
            >
              <View style={[styles.gameIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="th-large" size={18} color="#fff" />
              </View>
              <Text style={styles.gameTitle}>Nối từ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.gameCard, { backgroundColor: '#FFF3E0' }]}
              onPress={() => router.push('/vocabulary/practice?type=scramble')}
            >
              <View style={[styles.gameIcon, { backgroundColor: '#FF9800' }]}>
                <FontAwesome name="font" size={18} color="#fff" />
              </View>
              <Text style={styles.gameTitle}>Sắp xếp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.gameCard, { backgroundColor: '#E3F2FD' }]}
              onPress={() => router.push('/vocabulary/practice?type=listen_type')}
            >
              <View style={[styles.gameIcon, { backgroundColor: '#2196F3' }]}>
                <FontAwesome name="headphones" size={18} color="#fff" />
              </View>
              <Text style={styles.gameTitle}>Nghe viết</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Lộ trình học tập" />
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => router.push('/vocabulary/add-custom')}
            >
              <FontAwesome name="plus" size={12} color="#fff" />
              <Text style={styles.addBtnText}>Thêm lộ trình</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathScroll}>
            {paths.map((path) => (
              <TouchableOpacity 
                key={path.id} 
                style={[styles.pathCard, { backgroundColor: path.color + '10', borderColor: path.color + '30' }]}
                onPress={() => {
                  if (path.isCustom) {
                    router.push(`/vocabulary/words?groupBy=group_name&groupValue=${encodeURIComponent(path.id)}`);
                  } else {
                    router.push(`/vocabulary/words?groupBy=topic&groupValue=${encodeURIComponent(path.id)}`);
                  }
                }}
              >
                <View style={[styles.pathIcon, { backgroundColor: path.color }]}>
                  <FontAwesome name={path.icon as any} size={18} color="white" />
                </View>
                <Text style={styles.pathTitle} numberOfLines={1}>{path.title}</Text>
                <Text style={styles.pathSub}>{path.subtitle}</Text>
                <View style={styles.pathProgress}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${(path.learned / path.count) * 100}%`, backgroundColor: path.color }]} />
                  </View>
                  <Text style={styles.pathCount}>{path.learned}/{path.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {paths.length === 0 && (
               <Text style={{ color: colors.outline, marginLeft: spacing.lg, fontStyle: 'italic' }}>Chưa có lộ trình nào được tải...</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  greeting: {
    margin: spacing.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.outline,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDCB6E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  xpText: {
    color: '#E17055',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  gameScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    minWidth: 140,
    gap: spacing.sm,
  },
  gameIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  pathScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  pathCard: {
    width: 160,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pathIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  pathSub: {
    fontSize: 12,
    color: colors.outline,
    marginBottom: spacing.md,
  },
  pathProgress: {
    gap: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  pathCount: {
    fontSize: 10,
    color: colors.outline,
    textAlign: 'right',
  },
});
