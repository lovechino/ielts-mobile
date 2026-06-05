import { apiFetch } from '@/lib/api/client';
import type { VocabularyDTO, VocabularyCourseDTO, VocabProgressStatus } from '@/lib/api/types';

export function fetchVocabulary(params?: {
  vocab_course_id?: string;
  level?: string;
  topic?: string;
  structure_type?: string;
}): Promise<VocabularyDTO[]> {
  const qs = params ? Object.entries(params).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&') : '';
  return apiFetch<VocabularyDTO[]>(qs ? `/vocabulary/?${qs}` : '/vocabulary/');
}

export function fetchVocabularyCourses(): Promise<VocabularyCourseDTO[]> {
  return apiFetch<VocabularyCourseDTO[]>('/vocabulary/paths');
}

export function fetchVocabByWord(word: string): Promise<VocabularyDTO> {
  return apiFetch<VocabularyDTO>(`/vocabulary/${encodeURIComponent(word)}`);
}

export function updateVocabProgress(vocabId: string, status: VocabProgressStatus): Promise<any> {
  return apiFetch(`/vocabulary/${vocabId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify(status),
  });
}
