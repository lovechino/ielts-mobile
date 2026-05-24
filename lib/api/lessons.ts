import { apiFetch } from '@/lib/api/client';
import type { LessonDTO, QuestionDTO } from '@/lib/api/types';

export function fetchLesson(id: string): Promise<LessonDTO> {
  return apiFetch<LessonDTO>(`/courses/lessons/${id}`);
}

export function fetchLessonQuestions(lessonId: string): Promise<QuestionDTO[]> {
  return apiFetch<QuestionDTO[]>(`/courses/lessons/${lessonId}/questions`);
}
