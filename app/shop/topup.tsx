import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { api } from '@/lib/api';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TOPUP_PACKAGES = [
  { id: 'p1', gems: 100, price: 10000, label: 'Gói Khởi Đầu' },
  { id: 'p2', gems: 550, price: 50000, label: 'Gói Phổ Biến', popular: true },
  { id: 'p3', gems: 1200, price: 100000, label: 'Gói Tiết Kiệm' },
  { id: 'p4', gems: 3000, price: 200000, label: 'Gói Đại Gia' },
];

export default function TopupScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(TOPUP_PACKAGES[1]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Gọi API tạo link PayOS (Mock)
      const res = await api.post('/payment/payos/create-link', {
        amount: selectedPkg.price,
        description: `Nap ${selectedPkg.gems} Gems cho ${user?.full_name}`
      });

      if (res.success) {
        const { checkoutUrl, orderCode } = res.data;
        
        // 2. Mở trình duyệt giả lập PayOS
        Alert.alert(
          'Giả lập Thanh toán',
          `Bạn đang được chuyển đến PayOS để thanh toán ${selectedPkg.price.toLocaleString()}đ. (Môi trường TEST)`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác nhận Đã nạp (Simulate)', 
              onPress: async () => {
                // Giả lập Webhook callback thành công
                const simRes = await api.post('/payment/payos/simulate-success', { orderCode });
                if (simRes.success) {
                  Alert.alert('Thành công', `Đã nạp ${selectedPkg.gems} Gems!`);
                  router.back();
                }
              } 
            },
            {
              text: 'Mở Link (Mock)',
              onPress: () => Linking.openURL(checkoutUrl)
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo link thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nạp Gems</Text>
        <View style={styles.gemBalance}>
          <FontAwesome name="diamond" size={14} color="#00d2ff" />
          <Text style={styles.gemText}>{user?.gems || 0}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <FontAwesome name="diamond" size={50} color="#fff" />
          <Text style={styles.bannerTitle}>Gems - Đơn vị cao cấp</Text>
          <Text style={styles.bannerSub}>Dùng để mua Khung, Avatar và Streak Freeze hiếm.</Text>
        </View>

        <Text style={styles.sectionTitle}>Chọn gói nạp</Text>
        
        <View style={styles.packageGrid}>
          {TOPUP_PACKAGES.map((pkg, index) => (
            <Animated.View key={pkg.id} entering={FadeInDown.delay(index * 100)}>
              <TouchableOpacity 
                style={[
                  styles.packageCard, 
                  selectedPkg.id === pkg.id && styles.selectedCard,
                  pkg.popular && styles.popularCard
                ]}
                onPress={() => setSelectedPkg(pkg)}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>BEST</Text>
                  </View>
                )}
                <FontAwesome name="diamond" size={24} color={selectedPkg.id === pkg.id ? colors.primary : '#00d2ff'} />
                <Text style={styles.pkgGems}>{pkg.gems}</Text>
                <Text style={styles.pkgPrice}>{pkg.price.toLocaleString()}đ</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <FontAwesome name="info-circle" size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>Tỷ giá: 1.000đ = 10 Gems. Thanh toán qua PayOS (Ngân hàng/QR).</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payBtn, loading && styles.disabledBtn]} 
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>Nạp ngay · {selectedPkg.price.toLocaleString()}đ</Text>
          )}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  gemBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  gemText: { fontWeight: '800', color: '#0369a1' },

  container: { padding: spacing.lg, gap: spacing.xl },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl2,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 10,
    ...shadow.card,
  },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  packageCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  selectedCard: { borderColor: colors.primary, backgroundColor: '#f5f3ff' },
  popularCard: { position: 'relative' },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  pkgGems: { fontSize: 24, fontWeight: '900', color: colors.text },
  pkgPrice: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },

  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  payBtn: {
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledBtn: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
