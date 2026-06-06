import { create } from 'zustand';

interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  coins: number;
  isPlaying: boolean;
  gameType: 'match' | 'scramble' | 'flashcard' | 'listen_type' | null;
  
  // Actions
  startGame: (type: 'match' | 'scramble' | 'flashcard' | 'listen_type') => void;
  endGame: () => void;
  addScore: (points: number) => void;
  resetCombo: () => void;
  incrementCombo: () => void;
  addRewards: (coins: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  coins: 0,
  isPlaying: false,
  gameType: null,

  startGame: (type) => set({ 
    isPlaying: true, 
    gameType: type, 
    score: 0, 
    combo: 0, 
    maxCombo: 0 
  }),

  endGame: () => set({ isPlaying: false }),

  addScore: (points) => set((state) => ({ 
    score: state.score + points * (1 + Math.floor(state.combo / 5) * 0.1) 
  })),

  incrementCombo: () => set((state) => {
    const newCombo = state.combo + 1;
    return {
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
    };
  }),

  resetCombo: () => set({ combo: 0 }),

  addRewards: (coins) => set((state) => ({
    coins: state.coins + coins,
  })),

  resetGame: () => set({
    score: 0,
    combo: 0,
    maxCombo: 0,
    isPlaying: false,
    gameType: null,
  }),
}));
