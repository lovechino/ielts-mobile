import { apiFetch } from '@/lib/api/client';
import type { LessonDTO, QuestionDTO } from '@/lib/api/types';

export function fetchLesson(id: string): Promise<LessonDTO> {
  return apiFetch<LessonDTO>(`/test-sets/lessons/${id}`);
}

export function fetchLessonQuestions(lessonId: string): Promise<QuestionDTO[]> {
  return apiFetch<QuestionDTO[]>(`/test-sets/lessons/${lessonId}/questions`);
}
