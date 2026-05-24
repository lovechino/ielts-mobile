import { create } from 'zustand';
import { fetchVocabulary } from '@/lib/api/vocabulary';

interface DownloadInfo {
  status: 'pending' | 'downloading' | 'done' | 'error';
  progress: number;
  sizeKb?: number;
}

interface DownloadState {
  downloads: Record<string, DownloadInfo>;
  downloadCourse: (courseId: string) => Promise<void>;
  downloadVocabCourse: (courseId: string) => Promise<void>;
  deleteCourse: (courseId: string) => void;
  checkStatus: (id: string, isVocab: boolean) => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: {},

  downloadCourse: async (courseId) => {
    set((s) => ({ downloads: { ...s.downloads, [courseId]: { status: 'downloading', progress: 0 } } }));
    try {
      // Simulate download progress
      for (let pct = 0; pct <= 100; pct += 20) {
        await new Promise((r) => setTimeout(r, 200));
        set((s) => ({ downloads: { ...s.downloads, [courseId]: { ...s.downloads[courseId], progress: pct } } }));
      }
      set((s) => ({ downloads: { ...s.downloads, [courseId]: { status: 'done', progress: 100, sizeKb: 1024 } } }));
    } catch {
      set((s) => ({ downloads: { ...s.downloads, [courseId]: { status: 'error', progress: 0 } } }));
    }
  },

  downloadVocabCourse: async (courseId) => {
    set((s) => ({ downloads: { ...s.downloads, [courseId]: { status: 'downloading', progress: 0 } } }));
    try {
      await fetchVocabulary({ course_id: courseId });
      for (let pct = 0; pct <= 100; pct += 25) {
        await new Promise((r) => setTimeout(r, 150));
        set((s) => ({ downloads: { ...s.downloads, [courseId]: { ...s.downloads[courseId], progress: pct } } }));
      }
      set((s) => ({ downloads: { ...s.downloads, [courseId]: { status: 'done', progress: 100, sizeKb: 512 } } }));
    } catch {
      set((s) => ({ downloads: { ...s.downloads, [courseId]: { status: 'error', progress: 0 } } }));
    }
  },

  deleteCourse: (courseId) => {
    set((s) => {
      const next = { ...s.downloads };
      delete next[courseId];
      return { downloads: next };
    });
  },

  checkStatus: (_id, _isVocab) => {},
}));
