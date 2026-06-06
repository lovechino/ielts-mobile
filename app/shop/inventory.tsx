import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchInventory, equipItem, InventoryItem } from '@/lib/api/shop';
import { playSound } from '@/lib/sound';

const RARITY_COLORS = {
  common: '#94A3B8',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#EF4444',
};

export default function InventoryScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (item: InventoryItem) => {
    if (item.is_equipped || item.item_type === 'booster' || item.item_type === 'protection') return;
    
    setEquippingId(item.inventory_id);
    try {
      const res = await equipItem(item.inventory_id);
      if (res.success) {
        playSound('success');
        setItems(prev => prev.map(i => {
          if (i.item_type === item.item_type) {
            return { ...i, is_equipped: i.inventory_id === item.inventory_id };
          }
          return i;
        }));
        refreshUser();
      } else {
        playSound('error');
        Alert.alert('Lỗi', res.error || 'Không thể trang bị vật phẩm');
      }
    } catch (e) {
      playSound('error');
    } finally {
      setEquippingId(null);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kho đồ của tôi</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.inventory_id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[
              styles.itemCard, 
              { borderColor: item.rarity ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] + '40' : colors.border },
              item.is_equipped && styles.equippedCard
            ]}>
              {item.is_equipped && (
                <View style={styles.equippedBadge}>
                  <FontAwesome name="check" size={10} color="#fff" />
                </View>
              )}
              
              <View style={styles.imageContainer}>
                {item.sub_type === 'animated' && (
                  <View style={styles.animatedBadge}>
                    <FontAwesome name="play-circle" size={10} color="#fff" />
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
              <Text style={styles.itemType}>{item.item_type.toUpperCase()}</Text>

              <TouchableOpacity 
                style={[styles.actionBtn, item.is_equipped && styles.equippedBtn]}
                onPress={() => handleEquip(item)}
                disabled={item.is_equipped || equippingId === item.inventory_id}
              >
                {equippingId === item.inventory_id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {item.is_equipped ? 'ĐANG DÙNG' : 'TRANG BỊ'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="archive" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>Kho đồ đang trống.</Text>
              <TouchableOpacity style={styles.goShopBtn} onPress={() => router.push('/shop')}>
                 <Text style={styles.goShopText}>Đến Cửa hàng ngay</Text>
              </TouchableOpacity>
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
  
  listContent: { padding: spacing.md },
  itemCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2,
    ...shadow.card,
    position: 'relative',
  },
  equippedCard: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
  equippedBadge: { position: 'absolute', top: 0, right: 0, width: 24, height: 24, backgroundColor: colors.primary, borderBottomLeftRadius: radius.md, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  
  imageContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    position: 'relative',
  },
  itemImage: { width: '100%', height: '100%' },
  framePreview: { width: 70, height: 70, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  previewAvatar: { width: 50, height: 50, borderRadius: 25 },
  previewFrame: { width: 70, height: 70, position: 'absolute', top: 0, left: 0 },
  
  animatedBadge: { position: 'absolute', top: -5, left: -5, backgroundColor: '#FF4757', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  itemName: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2, textAlign: 'center' },
  itemType: { fontSize: 9, color: colors.outline, fontWeight: '800', marginBottom: spacing.md },
  
  actionBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, width: '100%', alignItems: 'center' },
  equippedBtn: { backgroundColor: colors.outlineVariant },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  goShopBtn: { marginTop: spacing.md, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: radius.pill },
  goShopText: { color: '#fff', fontWeight: '700' },
});
