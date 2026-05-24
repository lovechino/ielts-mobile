import { apiFetch } from '@/lib/api/client';
import type { CourseDTO, LessonDTO } from '@/lib/api/types';

export function fetchCourses(): Promise<CourseDTO[]> {
  return apiFetch<CourseDTO[]>('/courses/', { skipAuth: true });
}

export function fetchCourse(id: string): Promise<CourseDTO> {
  return apiFetch<CourseDTO>(`/courses/${id}`, { skipAuth: true });
}

export function fetchCourseLessons(courseId: string): Promise<LessonDTO[]> {
  return apiFetch<LessonDTO[]>(`/courses/${courseId}/lessons`, { skipAuth: true });
}

export function enrollCourse(courseId: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' });
}

export function checkEnrollment(courseId: string): Promise<{ enrolled: boolean; status?: string }> {
  return apiFetch(`/courses/${courseId}/enroll-status`);
}
