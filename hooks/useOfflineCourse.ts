import { useQuery } from '@tanstack/react-query';
import { fetchCourse, fetchCourseLessons } from '@/lib/api/courses';
import { fetchVocabulary } from '@/lib/api/vocabulary';
import { useDownloadStore } from '@/stores/useDownloadStore';

export function useOfflineCourse(courseId: string) {
  const isDownloaded = useDownloadStore((s) => s.downloads[courseId]?.status === 'done');

  return useQuery({
    queryKey: ['course-offline', courseId, isDownloaded],
    queryFn: async () => {
      const course = await fetchCourse(courseId);
      const lessons = await fetchCourseLessons(courseId);
      return { ...course, lessons, isOffline: false };
    },
    enabled: !!courseId,
  });
}

export function useOfflineVocab(courseSlug: string) {
  const isDownloaded = useDownloadStore((s) => s.downloads[courseSlug]?.status === 'done');

  return useQuery({
    queryKey: ['vocab-offline', courseSlug, isDownloaded],
    queryFn: () => fetchVocabulary({ course_id: courseSlug }),
    enabled: !!courseSlug,
  });
}
