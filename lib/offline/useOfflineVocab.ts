import { useEffect, useState } from 'react';
import { fetchVocabulary } from '@/lib/api/vocabulary';
import { readJSON, hasJSON } from '@/lib/offline/storage';
import type { VocabularyDTO } from '@/lib/api/types';

interface OfflineVocabState {
  words: VocabularyDTO[];
  loading: boolean;
  offline: boolean;
  cached: boolean;
  error: string | null;
}

export function useOfflineVocab(params: { vocab_course_id?: string; level?: string; topic?: string; structure_type?: string }): OfflineVocabState {
  const [state, setState] = useState<OfflineVocabState>({
    words: [], loading: true, offline: false, cached: false, error: null,
  });

  const courseId = params.vocab_course_id;
  const cacheKey = courseId || 'all';
  // Only cache full course downloads (no level/topic filter)
  const isCacheable = !params.level && !params.topic;

  useEffect(() => {
    if (!courseId) {
      setState({ words: [], loading: false, offline: false, cached: false, error: 'Missing vocab course ID.' });
      return;
    }
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        try {
          const words = await fetchVocabulary(params);
          if (!cancelled) setState({ words, loading: false, offline: false, cached: false, error: null });
          return;
        } catch {
          // Fall through to cache
        }
      }

      // Offline or fetch failed — try cache
      if (isCacheable) {
        const cached = await hasJSON('vocab', cacheKey);
        if (cached) {
          const result = await readJSON<VocabularyDTO[]>('vocab', cacheKey);
          if (result && !cancelled) {
            let words = result.data;
            if (params.level) words = words.filter((w) => w.level === params.level);
            if (params.topic) words = words.filter((w) => w.topic === params.topic);
            setState({ words, loading: false, offline: true, cached: true, error: null });
            return;
          }
        }
      }

      if (!cancelled) {
        setState((s) => ({
          ...s,
          loading: false,
          offline: !isOnline,
          error: isOnline ? 'Could not load vocabulary.' : 'Từ vựng chưa được tải về. Hãy kết nối mạng và tải xuống trước.',
        }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [courseId, params.level, params.topic]);

  return state;
}
