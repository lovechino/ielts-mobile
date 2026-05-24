import { apiFetch } from '@/lib/api/client';
import type { ProgressDTO } from '@/lib/api/types';

export function fetchProgress(lessonId: string): Promise<ProgressDTO | null> {
  return apiFetch<ProgressDTO | null>(`/progress/${lessonId}`);
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
