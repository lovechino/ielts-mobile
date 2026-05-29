import { Router } from 'expo-router';

/**
 * Parse một URL (custom scheme hoặc https) và navigate đến đúng màn hình.
 *
 * Supported patterns:
 *   ielts-master://course/{id}
 *   ielts-master://lesson/{id}?type=reading&part=1
 *   ielts-master://vocabulary/{id}
 *   ielts-master://vocabulary/words?vocab_course_id={id}&level=B1
 *   ielts-master://speaking/select
 *   ielts-master://speaking/session
 *   ielts-master://test
 *   https://ielts-platform.pages.dev/course/{id}   (Universal Link)
 *   https://ielts-platform.pages.dev/lesson/{id}   (Universal Link)
 */
export function handleDeepLink(url: string, router: Router): boolean {
  try {
    // Normalize: thay custom scheme thành https để dùng URL parser
    const normalized = url
      .replace(/^ielts-master:\/\//, 'https://app/')
      .replace(/^https:\/\/ielts-platform\.pages\.dev\//, 'https://app/');

    const parsed = new URL(normalized);
    const segments = parsed.pathname.replace(/^\//, '').split('/').filter(Boolean);

    if (segments.length === 0) {
      router.push('/(tabs)');
      return true;
    }

    const [first, second, ...rest] = segments;

    switch (first) {
      case 'course': {
        if (!second) return false;
        router.push(`/course/${second}`);
        return true;
      }

      case 'lesson': {
        if (!second) return false;
        const params = new URLSearchParams();
        const type = parsed.searchParams.get('type');
        const part = parsed.searchParams.get('part');
        const testType = parsed.searchParams.get('testType');
        if (type) params.set('type', type);
        if (part) params.set('part', part);
        if (testType) params.set('testType', testType);
        const qs = params.toString();
        router.push(`/lesson/${second}${qs ? `?${qs}` : ''}`);
        return true;
      }

      case 'vocabulary': {
        if (second === 'words') {
          const vocabCourseId = parsed.searchParams.get('vocab_course_id');
          const level = parsed.searchParams.get('level');
          const params = new URLSearchParams();
          if (vocabCourseId) params.set('vocab_course_id', vocabCourseId);
          if (level) params.set('level', level);
          const qs = params.toString();
          router.push(`/vocabulary/words${qs ? `?${qs}` : ''}`);
          return true;
        }
        if (second) {
          router.push(`/vocabulary/${second}`);
          return true;
        }
        return false;
      }

      case 'speaking': {
        if (second === 'select' || second === 'session' || second === 'report') {
          router.push(`/speaking/${second}`);
          return true;
        }
        router.push('/speaking/select');
        return true;
      }

      case 'test': {
        router.push('/(tabs)/test');
        return true;
      }

      case 'profile': {
        router.push('/(tabs)/profile');
        return true;
      }

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Tạo deep link URL từ route params.
 * Dùng để share link hoặc gửi trong push notification.
 */
export const DeepLinks = {
  course: (id: string) => `ielts-master://course/${id}`,
  lesson: (id: string, type: string, part?: number) => {
    const params = new URLSearchParams({ type });
    if (part) params.set('part', String(part));
    return `ielts-master://lesson/${id}?${params.toString()}`;
  },
  vocabulary: (id: string) => `ielts-master://vocabulary/${id}`,
  vocabularyWords: (vocabCourseId: string, level?: string) => {
    const params = new URLSearchParams({ vocab_course_id: vocabCourseId });
    if (level) params.set('level', level);
    return `ielts-master://vocabulary/words?${params.toString()}`;
  },
  speakingSelect: () => `ielts-master://speaking/select`,
  test: () => `ielts-master://test`,
};
