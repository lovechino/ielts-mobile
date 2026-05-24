import { apiFetch } from './client';
import type { LessonDTO } from './types';

export function getTests(type?: 'mini' | 'full'): Promise<LessonDTO[]> {
  const qs = type ? `?type=${type}` : '';
  return apiFetch<LessonDTO[]>(`/tests${qs}`, { skipAuth: true });
}
