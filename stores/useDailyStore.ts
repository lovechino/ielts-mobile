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
  
  fetchDailyChallenge: () => Promise<void>;
  completeTask: (taskId: string) => void;
  claimReward: () => Promise<void>;
}

/** Key lưu trạng thái task theo ngày: "daily_tasks_YYYY-MM-DD" */
function getTodayKey(): string {
  return `daily_tasks_${new Date().toISOString().slice(0, 10)}`;
}

async function loadPersistedTaskStatuses(): Promise<Record<string, 'pending' | 'completed'>> {
  try {
    const raw = await getSecureItem(getTodayKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function persistTaskStatuses(tasks: DailyTask[]): Promise<void> {
  try {
    const statuses: Record<string, 'pending' | 'completed'> = {};
    tasks.forEach(t => { statuses[t.id] = t.status; });
    await setSecureItem(getTodayKey(), JSON.stringify(statuses));
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

  fetchDailyChallenge: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/daily/today');
      if (res.success) {
        const data = res.data;

        // Load trạng thái đã persist từ hôm nay
        const savedStatuses = await loadPersistedTaskStatuses();

        const tasks: DailyTask[] = [];

        // Map vocab tasks
        if (data.tasks.vocab_ids) {
          tasks.push({
            id: 'daily-vocab',
            type: 'vocab',
            title: 'Học 5 từ vựng mới',
            status: savedStatuses['daily-vocab'] ?? 'pending',
            link: '/vocabulary/daily',
          });
        }

        // Map SRS tasks
        if (data.personalized.review_vocab_ids.length > 0) {
          tasks.push({
            id: 'review-vocab',
            type: 'review',
            title: `Ôn tập ${data.personalized.review_vocab_ids.length} từ cũ`,
            status: savedStatuses['review-vocab'] ?? 'pending',
            link: '/vocabulary/review',
          });
        }

        // Map Reading
        if (data.tasks.reading_id) {
          tasks.push({
            id: 'daily-reading',
            type: 'reading',
            title: 'Luyện Reading mini',
            status: savedStatuses['daily-reading'] ?? 'pending',
            link: `/lesson/${data.tasks.reading_id}?type=reading`,
          });
        }

        // Map Listening
        if (data.tasks.listening_id) {
          tasks.push({
            id: 'daily-listening',
            type: 'listening',
            title: 'Luyện Listening mini',
            status: savedStatuses['daily-listening'] ?? 'pending',
            link: `/lesson/${data.tasks.listening_id}?type=listening`,
          });
        }

        // Map Pronunciation
        if (data.tasks.pronunciation_word) {
          tasks.push({
            id: 'daily-speaking',
            type: 'speaking',
            title: `Phát âm: ${data.tasks.pronunciation_word}`,
            status: savedStatuses['daily-speaking'] ?? 'pending',
            link: '/vocabulary/pronounce',
          });
        }

        set({
          challengeId: data.id,
          tasks,
          isCompleted: data.is_completed,
          rewardClaimed: data.reward_claimed,
        });
      }
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
      const res = await api.post('/daily/claim', { challenge_id: challengeId });
      if (res.success) {
        set({ rewardClaimed: true });
      }
    } catch (error) {
      console.error('Claim rewards failed:', error);
    }
  }
}));
