import { create } from 'zustand';
import { getStreak, recordActivity } from '@/lib/api/stats';

interface StreakState {
  streakCount: number;
  coins: number;
  todayActive: boolean;
  loaded: boolean;
  fetchStreak: () => Promise<void>;
  recordActivity: () => Promise<void>;
  addCoins: (amount: number) => void;
}

export const useStreakStore = create<StreakState>((set) => ({
  streakCount: 0,
  coins: 0,
  todayActive: false,
  loaded: false,

  fetchStreak: async () => {
    try {
      const res = await getStreak();
      set({ streakCount: res.current_streak, todayActive: res.today_active, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  recordActivity: async () => {
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
}));
