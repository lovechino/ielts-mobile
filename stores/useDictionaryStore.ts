import { create } from 'zustand';
import { searchWords, getWordDetail, getMasteredCount, getLearningCount } from '@/lib/offline/dictionary';

interface DictionaryState {
  searchQuery: string;
  searchResults: any[];
  isLoading: boolean;
  recentSearches: any[];
  selectedWord: any | null;
  vaultLearningCount: number;
  vaultMasteredCount: number;
  
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  selectWord: (id: number) => Promise<void>;
  addToRecent: (word: any) => void;
  clearSearch: () => void;
  loadVaultCounts: () => Promise<void>;
  resetStore: () => void;
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
  searchQuery: '',
  searchResults: [],
  isLoading: false,
  recentSearches: [],
  selectedWord: null,
  vaultLearningCount: 0,
  vaultMasteredCount: 0,

  setSearchQuery: (query) => set({ searchQuery: query }),

  performSearch: async (query) => {
    if (!query) {
      set({ searchResults: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const results = await searchWords(query);
      set({ searchResults: results, isLoading: false });
    } catch (error) {
      console.error('Search error:', error);
      set({ isLoading: false });
    }
  },

  selectWord: async (id) => {
    set({ isLoading: true });
    try {
      const word = await getWordDetail(id);
      if (word) {
        set({ selectedWord: word, isLoading: false });
        get().addToRecent(word);
      }
    } catch (error) {
      console.error('Get word detail error:', error);
      set({ isLoading: false });
    }
  },

  addToRecent: (word) => {
    set((state) => {
      const filtered = state.recentSearches.filter((w) => w.id !== word.id);
      return {
        recentSearches: [word, ...filtered].slice(0, 10),
      };
    });
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [] }),

  loadVaultCounts: async () => {
    try {
      const [learning, mastered] = await Promise.all([getLearningCount(), getMasteredCount()]);
      set({ vaultLearningCount: learning, vaultMasteredCount: mastered });
    } catch (error) {
      console.error('Load vault counts error:', error);
    }
  },

  resetStore: () => set({
    searchQuery: '',
    searchResults: [],
    isLoading: false,
    recentSearches: [],
    selectedWord: null,
    vaultLearningCount: 0,
    vaultMasteredCount: 0,
  }),
}));
