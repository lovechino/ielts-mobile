import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { getVocabularyBundles, addBundleToVault } from '@/lib/offline/dictionary';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/stores/useAuthStore';

export default function RecommendationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<any[]>([]);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const setAssessmentCompleted = useAuthStore(s => s.setAssessmentCompleted);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    const data = await getVocabularyBundles();
    setBundles(data);
    setLoading(false);
  };

  const handleUnlock = (bundle: any) => {
    Alert.alert(
      'Mở khóa khóa học',
      `Bạn cần xem 1 quảng cáo ngắn để mở khóa bộ "${bundle.title}" (${bundle.count} từ).`,
      [
        { text: 'Để sau', style: 'cancel' },
        { 
          text: 'Xem quảng cáo', 
          onPress: () => simulateAdAndUnlock(bundle) 
        }
      ]
    );
  };

  const simulateAdAndUnlock = async (bundle: any) => {
    setUnlocking(bundle.id);
    // Giả lập thời gian xem quảng cáo 3s
    setTimeout(async () => {
      try {
        await addBundleToVault(bundle.id, bundle.title);
        setUnlocking(null);
        Alert.alert('Thành công', `Đã thêm ${bundle.title} vào Sổ tay của bạn.`, [
          { text: 'Học ngay', onPress: () => router.push('/vocabulary/vault') },
          { text: 'Ở lại đây' }
        ]);
      } catch (error) {
        setUnlocking(null);
        Alert.alert('Lỗi', 'Không thể mở khóa vào lúc này.');
      }
    }, 3000);
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lộ trình đề xuất</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Đã thiết kế xong lộ trình!</Text>
          <Text style={styles.introText}>
            Dựa trên trình độ của bạn, chúng tôi đề xuất các bộ từ vựng sau để tối ưu hóa việc học:
          </Text>
        </View>

        {bundles.map((bundle, index) => (
          <Animated.View 
            key={bundle.id} 
            entering={FadeInUp.delay(index * 100)}
            style={styles.bundleCard}
          >
            <View style={styles.bundleInfo}>
              <View style={styles.tagRow}>
                <View style={[styles.levelTag, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={styles.levelTagText}>{bundle.level}</Text>
                </View>
                <View style={[styles.topicTag, { backgroundColor: colors.secondary + '15' }]}>
                  <Text style={styles.topicTagText}>{bundle.topic}</Text>
                </View>
              </View>
              <Text style={styles.bundleTitle}>{bundle.title}</Text>
              <Text style={styles.bundleDesc}>{bundle.description}</Text>
              <View style={styles.countRow}>
                <FontAwesome name="book" size={14} color={colors.outline} />
                <Text style={styles.countText}>{bundle.count} từ vựng</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.unlockBtn, unlocking === bundle.id && styles.unlockBtnDisabled]}
              onPress={() => handleUnlock(bundle)}
              disabled={unlocking !== null}
            >
              {unlocking === bundle.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="play-circle" size={18} color="#fff" />
                  <Text style={styles.unlockBtnText}>Mở khóa miễn phí</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}

        <TouchableOpacity 
          style={styles.laterBtn} 
          onPress={() => {
            setAssessmentCompleted();
            router.push('/(tabs)');
          }}
        >
          <Text style={styles.laterText}>Tôi sẽ chọn sau</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.unit * 10,
    paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  
  content: { padding: spacing.lg, gap: spacing.lg },
  introBox: { gap: 8, marginBottom: spacing.sm },
  introTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  introText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },

  bundleCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  bundleInfo: { gap: 8 },
  tagRow: { flexDirection: 'row', gap: 8 },
  levelTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  levelTagText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  topicTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  topicTagText: { fontSize: 12, fontWeight: '800', color: colors.secondary },
  bundleTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  bundleDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontSize: 13, color: colors.outline, fontWeight: '600' },

  unlockBtn: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unlockBtnDisabled: { opacity: 0.7 },
  unlockBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  laterBtn: { alignItems: 'center', padding: spacing.md, marginTop: spacing.md },
  laterText: { color: colors.outline, fontSize: 15, fontWeight: '600' },
});
