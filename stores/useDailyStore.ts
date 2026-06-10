import { create } from 'zustand';
import { api } from '@/lib/api/api';
import { getSecureItem, setSecureItem } from '@/lib/storage';

interface DailyTask {
  id: string;
  type: 'vocab' | 'reading' | 'listening' | 'speaking' | 'review';
  title: string;
  status: 'pending' | 'completed';
  link: string;
}

interface DailyState {
  challengeId: string | null;
  tasks: DailyTask[];
  isCompleted: boolean;
  rewardClaimed: boolean;
  isLoading: boolean;
  lastFetched: string | null; // YYYY-MM-DD
  
  fetchDailyChallenge: (force?: boolean) => Promise<void>;
  completeTask: (taskId: string) => void;
  claimReward: () => Promise<void>;
  resetStore: () => void;
}

/** Trả về string YYYY-MM-DD */
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadPersistedTaskStatuses(dateKey: string): Promise<Record<string, 'pending' | 'completed'>> {
  try {
    const raw = await getSecureItem(`daily_tasks_${dateKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function persistTaskStatuses(tasks: DailyTask[]): Promise<void> {
  try {
    const dateKey = getTodayKey();
    const statuses: Record<string, 'pending' | 'completed'> = {};
    tasks.forEach(t => { statuses[t.id] = t.status; });
    await setSecureItem(`daily_tasks_${dateKey}`, JSON.stringify(statuses));
  } catch {
    // Ignore storage errors
  }
}

export const useDailyStore = create<DailyState>((set, get) => ({
  challengeId: null,
  tasks: [],
  isCompleted: false,
  rewardClaimed: false,
  isLoading: false,
  lastFetched: null,

  fetchDailyChallenge: async (force = false) => {
    const today = getTodayKey();
    
    // Nếu không phải force và đã load hôm nay rồi thì bỏ qua
    if (!force && get().lastFetched === today && get().tasks.length > 0) {
      return;
    }

    set({ isLoading: true });
    try {
      // apiFetch đã unwrap json.data — response IS the data directly
      const data = await api.get('/daily/today');

      // Load trạng thái đã persist từ hôm nay
      const savedStatuses = await loadPersistedTaskStatuses(today);

      const tasks: DailyTask[] = [];

      // Challenge mới dùng field `content` (structured JSON)
      // Challenge cũ dùng field `tasks` (vocab_ids, reading_id, ...)
      const content = data.content;
      const legacyTasks = data.tasks;

      // ── Vocab ────────────────────────────────────────────────────────────────
      const hasVocab = content?.vocabulary?.length > 0 || legacyTasks?.vocab_ids?.length > 0;
      if (hasVocab) {
        tasks.push({
          id: 'daily-vocab',
          type: 'vocab',
          title: `Học ${content?.vocabulary?.length ?? 5} từ vựng mới`,
          status: savedStatuses['daily-vocab'] ?? 'pending',
          link: '/vocabulary/daily',
        });
      }

      // ── SRS review ───────────────────────────────────────────────────────────
      if (data.personalized?.review_vocab_ids?.length > 0) {
        tasks.push({
          id: 'review-vocab',
          type: 'review',
          title: `Ôn tập ${data.personalized.review_vocab_ids.length} từ cũ`,
          status: savedStatuses['review-vocab'] ?? 'pending',
          link: '/vocabulary/review',
        });
      }

      // ── Reading ──────────────────────────────────────────────────────────────
      const hasReading = content?.reading?.title || legacyTasks?.reading_id;
      if (hasReading) {
        const readingLink = legacyTasks?.reading_id
          ? `/lesson/${legacyTasks.reading_id}?type=reading`
          : '/daily/reading';
        tasks.push({
          id: 'daily-reading',
          type: 'reading',
          title: content?.reading?.title ? `Reading: ${content.reading.title}` : 'Luyện Reading mini',
          status: savedStatuses['daily-reading'] ?? 'pending',
          link: readingLink,
        });
      }

      // ── Listening ────────────────────────────────────────────────────────────
      const hasListening = content?.listening?.transcript || legacyTasks?.listening_id;
      if (hasListening) {
        const listeningLink = legacyTasks?.listening_id
          ? `/lesson/${legacyTasks.listening_id}?type=listening`
          : '/daily/listening';
        tasks.push({
          id: 'daily-listening',
          type: 'listening',
          title: 'Luyện Listening mini',
          status: savedStatuses['daily-listening'] ?? 'pending',
          link: listeningLink,
        });
      }

      // ── Speaking / Pronunciation ─────────────────────────────────────────────
      const pronWord = legacyTasks?.pronunciation_word
        || content?.vocabulary?.[0]?.word;
      if (pronWord) {
        tasks.push({
          id: 'daily-speaking',
          type: 'speaking',
          title: `Phát âm: ${pronWord}`,
          status: savedStatuses['daily-speaking'] ?? 'pending',
          link: '/daily/pronounce',
        });
      }

      set({
        challengeId: data.id,
        tasks,
        isCompleted: data.is_completed,
        rewardClaimed: data.reward_claimed,
        lastFetched: today,
      });
    } catch (error) {
      console.error('Fetch daily challenge failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  completeTask: (taskId: string) => {
    const newTasks = get().tasks.map(t => 
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    );
    
    set({ tasks: newTasks });

    // Persist trạng thái để giữ sau khi restart app
    persistTaskStatuses(newTasks);

    // Kiểm tra nếu tất cả đã xong
    const allDone = newTasks.every(t => t.status === 'completed');
    if (allDone && !get().isCompleted) {
      const challengeId = get().challengeId;
      // Chỉ gọi API complete nếu có challengeId hợp lệ
      if (challengeId) {
        api.post('/daily/complete', { challenge_id: challengeId })
          .then(() => set({ isCompleted: true }))
          .catch((err) => {
            console.warn('[Daily] complete failed:', err?.message);
            // Vẫn set local completed để UX không bị stuck
            set({ isCompleted: true });
          });
      } else {
        set({ isCompleted: true });
      }
    }
  },

  claimReward: async () => {
    if (!get().isCompleted || get().rewardClaimed) return;
    const challengeId = get().challengeId;
    if (!challengeId) {
      // Không có challenge từ server (DB rỗng) → chỉ set local
      set({ rewardClaimed: true });
      return;
    }
    try {
      await api.post('/daily/claim', { challenge_id: challengeId });
      set({ rewardClaimed: true });
    } catch (error) {
      console.error('Claim rewards failed:', error);
    }
  },

  resetStore: () => {
    set({
      challengeId: null,
      tasks: [],
      isCompleted: false,
      rewardClaimed: false,
      isLoading: false,
      lastFetched: null,
    });
  }
}));
