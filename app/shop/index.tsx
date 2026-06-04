import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchShopItems, buyItem, ShopItem } from '@/lib/api/shop';
import { playSound } from '@/lib/sound';

const CATEGORIES = [
  { id: 'frame', label: 'Khung', icon: 'square-o' },
  { id: 'avatar', label: 'Avatar', icon: 'user' },
  { id: 'booster', label: 'Bổ trợ', icon: 'bolt' },
];

const SUB_TYPES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'static', label: 'Tĩnh' },
  { id: 'animated', label: 'Động' },
];

const RARITY_COLORS = {
  common: '#94A3B8',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#EF4444',
};

export default function ShopScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('frame');
  const [selectedSubType, setSelectedSubType] = useState('all');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchShopItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item: ShopItem) => {
    Alert.alert(
      'Xác nhận mua',
      `Bạn có muốn mua "${item.name}" với giá ${item.price_coins} xu không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Mua ngay',
          onPress: async () => {
            setBuyingId(item.id);
            try {
              const res = await buyItem(item.id);
              if (res.success) {
                playSound('success');
                Alert.alert('Thành công!', `Bạn đã sở hữu "${item.name}". Hãy vào kho đồ để trang bị.`);
                refreshUser();
              } else {
                playSound('error');
                Alert.alert('Lỗi', res.error || 'Giao dịch thất bại');
              }
            } catch (e) {
              playSound('error');
              Alert.alert('Lỗi', 'Có lỗi kết nối mạng');
            } finally {
              setBuyingId(null);
            }
          }
        }
      ]
    );
  };

  const filteredItems = items.filter(i => {
    const matchCat = i.item_type === selectedCat;
    const matchSubType = selectedSubType === 'all' || i.sub_type === selectedSubType;
    return matchCat && matchSubType;
  });

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cửa hàng</Text>
        <View style={styles.currencyContainer}>
          <View style={styles.coinBadge}>
            <FontAwesome name="database" size={12} color="#F1C40F" />
            <Text style={styles.coinText}>{user?.coins || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.topTabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tabBtn, selectedCat === cat.id && styles.tabBtnActive]}
            onPress={() => {
              playSound('click');
              setSelectedCat(cat.id);
            }}
          >
            <FontAwesome 
              name={cat.icon as any} 
              size={16} 
              color={selectedCat === cat.id ? colors.primary : colors.outline} 
            />
            <Text style={[styles.tabText, selectedCat === cat.id && styles.tabTextActive]}>
              {cat.label}
            </Text>
            {selectedCat === cat.id && <View style={styles.activeLine} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.subFilterBar}>
        {SUB_TYPES.map(sub => (
          <TouchableOpacity
            key={sub.id}
            style={[styles.subBtn, selectedSubType === sub.id && styles.subBtnActive]}
            onPress={() => {
              playSound('click');
              setSelectedSubType(sub.id);
            }}
          >
            <Text style={[styles.subText, selectedSubType === sub.id && styles.subTextActive]}>
              {sub.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, { borderColor: item.rarity ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] + '40' : colors.border }]}>
              {item.rarity && (
                <View style={[styles.rarityTag, { backgroundColor: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }]}>
                  <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
                </View>
              )}
              
              <View style={styles.imageContainer}>
                {item.sub_type === 'animated' && (
                  <View style={styles.animatedBadge}>
                    <FontAwesome name="play-circle" size={10} color="#fff" />
                    <Text style={styles.animatedText}>ĐỘNG</Text>
                  </View>
                )}
                
                {item.item_type === 'frame' ? (
                  <View style={styles.framePreview}>
                    <Image 
                      source={{ uri: user?.avatar_url || 'https://avatar.iran.liara.run/public/boy' }} 
                      style={styles.previewAvatar} 
                    />
                    <Image source={{ uri: item.image_url }} style={styles.previewFrame} />
                  </View>
                ) : (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="contain" />
                )}
              </View>
              
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              
              <TouchableOpacity 
                style={[styles.buyBtn, { backgroundColor: colors.primary }]} 
                onPress={() => handleBuy(item)}
                disabled={buyingId === item.id}
              >
                <FontAwesome name="database" size={10} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buyBtnText}>{item.price_coins}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="search" size={40} color={colors.outlineVariant} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>Chưa có vật phẩm nào phù hợp.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  currencyContainer: { flexDirection: 'row', gap: spacing.sm },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1C40F20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, gap: 6 },
  coinText: { color: '#B7950B', fontWeight: '700', fontSize: 14 },

  topTabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, position: 'relative' },
  tabBtnActive: {},
  tabText: { fontSize: 13, fontWeight: '600', color: colors.outline },
  tabTextActive: { color: colors.primary },
  activeLine: { position: 'absolute', bottom: 0, width: '40%', height: 3, backgroundColor: colors.primary, borderRadius: 2 },

  subFilterBar: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  subBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surfaceContainerLow },
  subBtnActive: { backgroundColor: colors.primaryFixed },
  subText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  subTextActive: { color: colors.primary },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  itemCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2,
    ...shadow.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  rarityTag: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 8, paddingVertical: 2, borderBottomRightRadius: radius.sm },
  rarityText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  
  imageContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    position: 'relative',
  },
  itemImage: { width: '100%', height: '100%' },
  framePreview: { width: 80, height: 80, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  previewAvatar: { width: 60, height: 60, borderRadius: 30 },
  previewFrame: { width: 80, height: 80, position: 'absolute', top: 0, left: 0 },
  
  animatedBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF4757', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 2, zIndex: 10 },
  animatedText: { fontSize: 8, fontWeight: '800', color: '#fff' },

  itemName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  
  buyBtn: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  buyBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontStyle: 'italic' },
});
