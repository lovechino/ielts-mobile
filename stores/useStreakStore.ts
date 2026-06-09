import { create } from 'zustand';
import { getStreak, recordActivity } from '@/lib/api/stats';

interface StreakState {
  streakCount: number;
  coins: number;
  todayActive: boolean;
  loaded: boolean;
  lastFetched: number;
  fetchStreak: (force?: boolean) => Promise<void>;
  recordActivity: () => Promise<void>;
  addCoins: (amount: number) => void;
  resetStore: () => void;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  streakCount: 0,
  coins: 0,
  todayActive: false,
  loaded: false,
  lastFetched: 0,

  fetchStreak: async (force = false) => {
    const now = Date.now();
    // Cache streak trong 5 phút
    if (!force && get().loaded && (now - get().lastFetched < 5 * 60 * 1000)) {
      return;
    }

    try {
      const res = await getStreak();
      set({ 
        streakCount: res.current_streak, 
        todayActive: res.today_active, 
        loaded: true,
        lastFetched: now 
      });
    } catch {
      set({ loaded: true });
    }
  },

  recordActivity: async () => {
    // Nếu hôm nay đã active rồi thì không cần gọi API nữa
    if (get().todayActive) return;

    try {
      const res = await recordActivity();
      set({ streakCount: res.current_streak, coins: 0, todayActive: res.today_active });
    } catch {
      // silently fail
    }
  },

  addCoins: (amount) => {
    set((s) => ({ coins: s.coins + amount }));
  },

  resetStore: () => {
    set({
      streakCount: 0,
      coins: 0,
      todayActive: false,
      loaded: false,
      lastFetched: 0,
    });
  },
}));
