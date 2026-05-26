import { create } from 'zustand';
import { saveJSON, removeJSON, hasJSON, getCacheSize } from '@/lib/offline/storage';
import { fetchCourse, fetchCourseLessons } from '@/lib/api/courses';
import { fetchVocabulary } from '@/lib/api/vocabulary';

interface DownloadInfo {
  status: 'idle' | 'downloading' | 'cached' | 'error';
  sizeKb?: number;
}

interface DownloadState {
  downloads: Record<string, DownloadInfo>;
  hydrate: () => Promise<void>;
  downloadCourse: (courseId: string) => Promise<void>;
  downloadVocab: (courseId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getStatus: (id: string) => DownloadInfo;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: {},

  hydrate: async () => {
    const { downloads } = get();
    const updated: Record<string, DownloadInfo> = {};
    for (const id of Object.keys(downloads)) {
      if (downloads[id].status === 'cached') {
        const exists = await hasJSON(id.startsWith('voc:') ? 'vocab' : 'course', id.replace(/^voc:/, ''));
        updated[id] = exists ? downloads[id] : { status: 'idle' };
      }
    }
    if (Object.keys(updated).length > 0) {
      set({ downloads: { ...downloads, ...updated } });
    }
  },

  downloadCourse: async (courseId) => {
    const key = courseId;
    set((s) => ({ downloads: { ...s.downloads, [key]: { status: 'downloading' } } }));
    try {
      const [course, lessons] = await Promise.all([
        fetchCourse(courseId),
        fetchCourseLessons(courseId),
      ]);
      await saveJSON('course', courseId, { course, lessons });
      const kb = await getCacheSize('course', courseId);
      set((s) => ({ downloads: { ...s.downloads, [key]: { status: 'cached', sizeKb: Math.round(kb / 1024) } } }));
    } catch {
      set((s) => ({ downloads: { ...s.downloads, [key]: { status: 'error' } } }));
    }
  },

  downloadVocab: async (courseId) => {
    const key = `voc:${courseId}`;
    set((s) => ({ downloads: { ...s.downloads, [key]: { status: 'downloading' } } }));
    try {
      const words = await fetchVocabulary({ vocab_course_id: courseId });
      await saveJSON('vocab', courseId, words);
      const kb = await getCacheSize('vocab', courseId);
      set((s) => ({ downloads: { ...s.downloads, [key]: { status: 'cached', sizeKb: Math.round(kb / 1024) } } }));
    } catch {
      set((s) => ({ downloads: { ...s.downloads, [key]: { status: 'error' } } }));
    }
  },

  remove: async (id) => {
    const isVoc = id.startsWith('voc:');
    const realId = isVoc ? id.slice(4) : id;
    await removeJSON(isVoc ? 'vocab' : 'course', realId);
    set((s) => {
      const next = { ...s.downloads };
      delete next[id];
      return { downloads: next };
    });
  },

  getStatus: (id) => get().downloads[id] || { status: 'idle' },
}));
