import { API_BASE_URL } from '@/constants/config';
import { getSecureItem } from '@/lib/storage';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: 'avatar' | 'frame' | 'booster' | 'protection';
  sub_type?: 'static' | 'animated';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  price_coins: number;
  price_gems: number;
  image_url: string;
  metadata?: any;
}

export interface InventoryItem extends ShopItem {
  inventory_id: string;
  quantity: number;
  is_equipped: boolean;
  expires_at: string | null;
}

import { STORAGE_KEYS } from '@/lib/storage';

async function getAuthHeader() {
  const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
  return { 'Authorization': `Bearer ${token}` };
}

export const fetchShopItems = async (): Promise<ShopItem[]> => {
  const headers = await getAuthHeader();
  try {
    const res = await fetch(`${API_BASE_URL}/shop/items`, { headers });
    const json = await res.json();
    if (json.success && json.data.length > 0) return json.data;
  } catch (e) {
    console.warn('[Shop] API fetch failed, using mock data');
  }

  // Mock data for UI development
  return [
    {
      id: 'frame_1',
      name: 'Khung Gỗ Basic',
      description: 'Khung gỗ đơn giản cho người mới.',
      item_type: 'frame',
      sub_type: 'static',
      price_coins: 500,
      price_gems: 0,
      image_url: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png',
    },
    {
      id: 'frame_2',
      name: 'Hào Quang Rực Rỡ',
      description: 'Khung động với hiệu ứng ánh sáng.',
      item_type: 'frame',
      sub_type: 'animated',
      rarity: 'epic',
      price_coins: 5000,
      price_gems: 50,
      image_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzBxdmZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKIFm1pG8xV6yU8/giphy.gif',
    },
    {
      id: 'avatar_1',
      name: 'Mèo Phi Hành Gia',
      description: 'Avatar tĩnh siêu đáng yêu.',
      item_type: 'avatar',
      sub_type: 'static',
      price_coins: 1000,
      price_gems: 0,
      image_url: 'https://avatar.iran.liara.run/public/3',
    },
    {
      id: 'avatar_2',
      name: 'Rồng Thần Chớp Nhoáng',
      description: 'Avatar động cực ngầu.',
      item_type: 'avatar',
      sub_type: 'animated',
      rarity: 'legendary',
      price_coins: 10000,
      price_gems: 100,
      image_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzBxdmZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/Lp71UqhxCiaf6/giphy.gif',
    }
  ];
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shop/inventory`, { headers });
  const json = await res.json();
  return json.success ? json.data : [];
};

export const buyItem = async (itemId: string, quantity = 1) => {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shop/buy`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, quantity }),
  });
  return await res.json();
};

export const equipItem = async (inventoryId: string) => {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shop/equip`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inventoryId }),
  });
  return await res.json();
};
