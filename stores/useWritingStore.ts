import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

interface WritingStore {
  drafts: Record<string, string>;
  wordCounts: Record<string, number>;
  lastSavedAt: Record<string, number>;
  autoSave: (taskId: string, text: string) => void;
  getDraft: (taskId: string) => string;
  clearDraft: (taskId: string) => void;
  resetStore: () => void;
}

export const useWritingStore = create<WritingStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      wordCounts: {},
      lastSavedAt: {},

      autoSave: (taskId, text) => {
        const wc = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        set((s) => ({
          drafts: { ...s.drafts, [taskId]: text },
          wordCounts: { ...s.wordCounts, [taskId]: wc },
          lastSavedAt: { ...s.lastSavedAt, [taskId]: Date.now() },
        }));
      },

      getDraft: (taskId) => {
        return get().drafts[taskId] || '';
      },

      clearDraft: (taskId) => {
        set((s) => {
          const { [taskId]: _, ...rest } = s.drafts;
          const { [taskId]: __, ...wcRest } = s.wordCounts;
          const { [taskId]: ___, ...lsRest } = s.lastSavedAt;
          return { drafts: rest, wordCounts: wcRest, lastSavedAt: lsRest };
        });
      },

      resetStore: () => {
        set({ drafts: {}, wordCounts: {}, lastSavedAt: {} });
      },
    }),
    { 
      name: 'ielts-writing-drafts',
      storage: zustandStorage,
    }
  )
);
