import { useEffect, useState } from 'react';
import { fetchCourse, fetchCourseLessons } from '@/lib/api/courses';
import { readJSON, hasJSON } from '@/lib/offline/storage';
import type { CourseDTO, LessonDTO } from '@/lib/api/types';

interface OfflineCourseState {
  course: CourseDTO | null;
  lessons: LessonDTO[];
  loading: boolean;
  offline: boolean;
  cached: boolean;
  error: string | null;
}

export function useOfflineCourse(id: string | undefined): OfflineCourseState {
  const [state, setState] = useState<OfflineCourseState>({
    course: null, lessons: [], loading: true, offline: false, cached: false, error: null,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        try {
          const [course, lessons] = await Promise.all([
            fetchCourse(id!),
            fetchCourseLessons(id!),
          ]);
          if (!cancelled) setState({ course, lessons, loading: false, offline: false, cached: false, error: null });
          return;
        } catch {
          // Fall through to offline cache
        }
      }

      // Offline or fetch failed — try cache
      const cached = await hasJSON('course', id!);
      if (cached) {
        const result = await readJSON<{ course: CourseDTO; lessons: LessonDTO[] }>('course', id!);
        if (result && !cancelled) {
          setState({
            course: result.data.course,
            lessons: result.data.lessons,
            loading: false,
            offline: true,
            cached: true,
            error: null,
          });
          return;
        }
      }

      if (!cancelled) {
        setState((s) => ({
          ...s,
          loading: false,
          offline: !isOnline,
          error: isOnline ? 'Could not load course.' : 'Nội dung chưa được tải về. Hãy kết nối mạng và tải xuống trước.',
        }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return state;
}
