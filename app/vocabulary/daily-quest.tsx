import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { api } from '@/lib/api';
import { FontAwesome } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function DailyQuestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadTodayChallenge();
  }, []);

  const loadTodayChallenge = async () => {
    setLoading(true);
    try {
      const res = await api.get('/daily/today');
      if (res.success) {
        setChallenge(res.data);
      }
    } catch (error) {
      console.error('Load daily quest error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await api.post('/daily/claim', { challenge_id: challenge.id });
      if (res.success) {
        Alert.alert('Chúc mừng!', 'Bạn đã nhận được 100 XP và 50 Xu.');
        loadTodayChallenge(); // Refresh state
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể nhận thưởng lúc này.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!challenge) {
    return (
      <Screen style={styles.centered}>
        <FontAwesome name="calendar-o" size={60} color={colors.border} />
        <Text style={styles.emptyText}>Hôm nay chưa có thử thách nào. Hãy quay lại sau nhé!</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const { content, is_completed, reward_claimed } = challenge;

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhiệm vụ hằng ngày</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp}>
          <GlassCard style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
              <Text style={styles.topicTitle}>{challenge.topic}</Text>
              <View style={styles.rewardBadge}>
                <FontAwesome name="database" size={12} color="#F9CA24" />
                <Text style={styles.rewardText}>Thưởng: 100 XP & 50 Xu</Text>
              </View>
            </View>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2436/2436631.png' }} 
              style={styles.bannerImg} 
            />
          </GlassCard>
        </Animated.View>

        <Text style={styles.sectionTitle}>Danh sách bài tập</Text>

        <View style={styles.taskList}>
          {/* Task 1: Vocabulary */}
          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => router.push({
              pathname: '/vocabulary/practice',
              params: { type: 'match', daily: 'true' }
            })}
          >
            <View style={[styles.taskIcon, { backgroundColor: '#E8F5E9' }]}>
              <FontAwesome name="book" size={20} color="#4CAF50" />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskName}>Luyện {content.vocabulary?.length || 0} từ vựng mới</Text>
              <Text style={styles.taskStatus}>{is_completed ? 'Đã hoàn thành' : 'Chưa làm'}</Text>
            </View>
            {is_completed && <FontAwesome name="check-circle" size={24} color="#4CAF50" />}
          </TouchableOpacity>

          {/* Task 2: Reading */}
          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => Alert.alert('Thông báo', 'Tính năng bài đọc Daily đang được tích hợp...')}
          >
            <View style={[styles.taskIcon, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome name="file-text-o" size={20} color="#2196F3" />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskName}>Đọc hiểu: {content.reading?.title}</Text>
              <Text style={styles.taskStatus}>{is_completed ? 'Đã hoàn thành' : 'Chưa làm'}</Text>
            </View>
            {is_completed && <FontAwesome name="check-circle" size={24} color="#4CAF50" />}
          </TouchableOpacity>
        </View>

        {is_completed && !reward_claimed && (
          <Animated.View entering={FadeInDown} style={styles.claimSection}>
            <TouchableOpacity 
              style={styles.claimBtn}
              onPress={handleClaimReward}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome name="gift" size={24} color="#fff" />
                  <Text style={styles.claimBtnText}>Nhận thưởng ngay</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {reward_claimed && (
          <View style={styles.doneSection}>
            <FontAwesome name="check-circle" size={40} color="#4CAF50" />
            <Text style={styles.doneText}>Bạn đã hoàn thành xuất sắc thử thách hôm nay!</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center', gap: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.unit * 10,
    paddingBottom: spacing.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  
  container: { padding: spacing.lg, gap: spacing.xl },
  banner: {
    flexDirection: 'row',
    padding: spacing.xl,
    borderRadius: radius.xl2,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  bannerContent: { flex: 1, gap: 4 },
  dateText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  topicTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginVertical: 4 },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rewardText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bannerImg: { width: 100, height: 100, position: 'absolute', right: -10, bottom: -10, opacity: 0.3 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  taskList: { gap: spacing.md },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: { flex: 1, gap: 2 },
  taskName: { fontSize: 16, fontWeight: '700', color: colors.text },
  taskStatus: { fontSize: 12, color: colors.outline, fontWeight: '600' },

  claimSection: { marginTop: spacing.xl },
  claimBtn: {
    height: 60,
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  claimBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  doneSection: { alignItems: 'center', gap: 12, marginTop: spacing.xl },
  doneText: { color: colors.textSecondary, fontWeight: '600', textAlign: 'center', fontSize: 15 },
  
  emptyText: { textAlign: 'center', color: colors.textSecondary, paddingHorizontal: 40 },
  backBtn: { paddingHorizontal: 30, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: radius.md },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
