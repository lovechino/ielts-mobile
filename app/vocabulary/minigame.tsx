import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/theme/tokens';
import { loadContextWords, ContextWord } from '@/lib/offline/vocabContext';
import { api } from '@/lib/api/api';
import { useAuthStore } from '@/stores/useAuthStore';

import { QuizGame } from '@/components/games/QuizGame';
import { TypingGame } from '@/components/games/TypingGame';
import { ListeningGame } from '@/components/games/ListeningGame';
import { MatchingGame } from '@/components/games/MatchingGame';
import { CombinedGame } from '@/components/games/CombinedGame';
import { FlashcardContextGame } from '@/components/games/FlashcardContextGame';

const MIN_WORDS: Record<string, number> = {
  flashcard: 4, quiz: 4, listening: 4,
  typing: 4, matching: 4, combined: 6,
};

export default function MinigameScreen() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const { mode, groupBy, groupValue } = useLocalSearchParams<{
    mode: string; groupBy: string; groupValue: string;
  }>();

  const [words, setWords] = useState<ContextWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [mode, groupBy, groupValue]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const limit = mode === 'combined' ? 30 : mode === 'matching' ? 8 : 20;
      const result = await loadContextWords(
        { groupBy: groupBy || '', groupValue: groupValue || '' },
        limit
      );
      const minNeeded = MIN_WORDS[mode || ''] ?? 4;
      if (result.length < minNeeded) {
        setError(`Cần ít nhất ${minNeeded} từ vựng để chơi chế độ này.\nLộ trình này chỉ có ${result.length} từ hợp lệ.`);
      } else {
        setWords(result);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  const syncRewards = async (coins: number) => {
    if (coins <= 0) return;
    try {
      await api.post('/stats/rewards', { xp: 0, coins });
      await refreshUser(); // Đợi refresh xong mới tiếp tục
    } catch (e) {
      console.error('[Minigame] Failed to sync rewards:', e);
    }
  };

  const onFinish = async (coins: number = 0) => {
    if (typeof coins === 'number' && coins > 0) {
      await syncRewards(coins);
    }
    router.back();
  };

  const title = {
    flashcard: 'Flashcard', quiz: 'Quiz', listening: 'Nghe & Gõ',
    typing: 'Typing', matching: 'Ghép cặp', combined: 'Tổng hợp',
  }[mode || ''] ?? 'Luyện tập';

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải từ vựng...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📚</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>{groupValue || 'Luyện tập'} · {words.length} từ</Text>
      </View>

      {mode === 'flashcard' && <FlashcardContextGame words={words} onFinish={onFinish} />}
      {mode === 'quiz'      && <QuizGame words={words} onFinish={onFinish} />}
      {mode === 'listening' && <ListeningGame words={words} onFinish={onFinish} />}
      {mode === 'typing'    && <TypingGame words={words} onFinish={onFinish} />}
      {mode === 'matching'  && <MatchingGame words={words.slice(0, 8)} onFinish={onFinish} />}
      {mode === 'combined'  && <CombinedGame words={words} onFinish={onFinish} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { fontSize: 15, color: colors.textSecondary },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: 15, color: colors.text, textAlign: 'center', lineHeight: 24 },
  backBtn: { marginTop: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  closeBtn: { position: 'absolute', left: spacing.md, top: spacing.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18, color: colors.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
