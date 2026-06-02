import { apiFetch } from '@/lib/api/client';
import type { ProgressDTO } from '@/lib/api/types';
import EventSource from 'react-native-sse';
import { API_BASE_URL } from '@/constants/config';
import { getSecureItem, STORAGE_KEYS } from '@/lib/storage';

export function fetchProgress(lessonId: string): Promise<ProgressDTO | null> {
  return apiFetch<ProgressDTO | null>(`/progress/${lessonId}`);
}

/** Lấy kết quả theo progress_id cụ thể — dùng cho history detail để tránh trả về lần làm mới nhất */
export function fetchProgressById(progressId: string): Promise<ProgressDTO | null> {
  return apiFetch<ProgressDTO | null>(`/progress/by-id/${progressId}`);
}

export function saveDraft(data: {
  lesson_id: string;
  draft_answers: Record<string, string>;
  time_left: number;
  status?: string;
}): Promise<ProgressDTO> {
  return apiFetch<ProgressDTO>('/progress/save-draft', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function submitAnswers(data: {
  lesson_id: string;
  answers: Array<{ question_id: string; answer: string }>;
}): Promise<ProgressDTO> {
  return apiFetch<ProgressDTO>('/progress/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Test History ─────────────────────────────────────────────────────────────

export interface TestHistoryItem {
  id: string;           // progress_id hoặc session_id
  kind?: string;        // 'test' | 'speaking'
  progress_id: string;  // alias cho id (backward compat)
  lesson_id: string;
  lesson_title: string;
  lesson_type: string | null;
  test_type: string | null;
  score: number | null;
  total_questions: number;
  correct_answers: number;
  accuracy_pct: number;
  scoring_status: 'none' | 'pending' | 'completed' | 'failed';
  full_result_unlocked: boolean;
  needs_unlock: boolean;
  result_available_at: number | null;
  completed_at: number | null;
}

export function fetchTestHistory(params?: {
  type?: 'mini' | 'full' | 'practice';
  limit?: number;
  offset?: number;
}): Promise<TestHistoryItem[]> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return apiFetch<any[]>(`/progress/history${query ? `?${query}` : ''}`)
    .then((rows) => rows.map((r) => ({
      ...r,
      progress_id: r.id ?? r.progress_id, // normalize
    })));
}

export interface UnlockResultDTO {
  unlocked: boolean;
  already_unlocked?: boolean;
  results?: Array<{
    question_id: string;
    score?: number;
    feedback?: {
      overall_score?: number;
      criteria_scores?: Record<string, number>;
      feedback?: string;
      suggested_version?: string;
    };
  }>;
}

export function unlockResult(progressId: string): Promise<UnlockResultDTO> {
  return apiFetch<UnlockResultDTO>(`/progress/${progressId}/unlock`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── SSE Streaming ────────────────────────────────────────────────────────────

export async function listenToProgressStream(
  progressId: string,
  onComplete: (data: ProgressDTO) => void,
  onError: (err: any) => void
) {
  const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
  const es = new EventSource(`${API_BASE_URL}/progress/${progressId}/stream`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  es.addEventListener('completed' as any, (event: any) => {
    try {
      const data = JSON.parse(event.data);
      onComplete(data);
      es.close();
    } catch (e) {
      onError(e);
      es.close();
    }
  });

  es.addEventListener('error' as any, (event: any) => {
    onError(event);
    es.close();
  });

  return () => {
    es.close();
  };
}
