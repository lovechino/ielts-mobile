export interface CourseDTO {
  id: string;
  title: string;
  description?: string | null;
  level?: string | null;
  thumbnail_url?: string | null;
  price?: number | null;
}

export interface LessonDTO {
  id: string;
  course_id: string;
  title: string;
  content?: string | null;
  order?: number | null;
  lesson_type?: string | null;
  pdf_url?: string | null;
  time_limit?: number | null;
  is_test?: boolean | null;
  test_type?: string | null;
  /**
   * Unified parts array for ALL skills.
   * Speaking: [1,2,3] | Writing: [1] or [2] or [1,2] | Reading/Listening: [1,3] etc.
   * This is the single source of truth — use this instead of speaking_part.
   */
  lesson_parts?: number[] | null;
  /** @deprecated Legacy single-part field. Use lesson_parts instead. */
  speaking_part?: number | null;
  passages?: PassageDTO[];
  question_groups?: QuestionGroupDTO[];
}

export interface PassageDTO {
  id: string;
  lesson_id: string;
  title?: string | null;
  content_html?: string | null;
  order?: number | null;
  /** IELTS part number (1, 2, or 3). Used for grouped rendering in mixed-part tests. */
  part?: number | null;
  audio_url?: string | null;
  transcript?: string | null;
}

export interface QuestionGroupDTO {
  id: string;
  lesson_id: string;
  passage_id?: string | null;
  title?: string | null;
  instruction?: string | null;
  group_type?: string | null;
  order?: number | null;
  /** IELTS part number (1, 2, or 3). Used for grouped rendering in mixed-part tests. */
  part?: number | null;
  options_pool?: any[] | null;
  config?: Record<string, any> | null;
  content_template?: string | null;
}

export interface QuestionDTO {
  id: string;
  content: string;
  question_type: string;
  options?: Record<string, string> | null;
  correct_answer?: string | null;
  lesson_id: string;
  group_id?: string | null;
  question_format?: string | null;
  marker_id?: string | null;
  content_template?: string | null;
  audio_timestamp_start?: number | null;
  audio_timestamp_end?: number | null;
}

export interface UserDTO {
  id: string;
  email: string;
  full_name: string;
  role: string;
  target_band?: number | null;
  avatar_url?: string | null;
  ai_persona?: string | null;
  coins?: number;
  xp?: number;
  enrolled_courses?: EnrolledCourseDTO[];
}

export interface EnrolledCourseDTO {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  enrolled_at?: string | null;
  status?: string | null;
}

export interface VocabularyCourseDTO {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  structure_type: 'cefr_levels' | 'direct_topics';
}

export interface VocabularyDTO {
  id: string;
  vocab_course_id?: string | null;
  word: string;
  definition?: string | null;
  definition_vi?: string | null;
  example?: string | null;
  example_vi?: string | null;
  topic?: string | null;
  level?: string | null;
  pronunciation?: string | null;
  part_of_speech?: string | null;
}

export interface ProgressResultItem {
  question_id: string;
  is_correct: boolean;
  correct_answer?: string;
  answer?: string;
  score?: number;
  /** AI writing feedback object — chỉ có với lesson_type = 'writing' */
  feedback?: {
    overall_score?: number;
    criteria_scores?: {
      task_response?: number;
      coherence_cohesion?: number;
      lexical_resource?: number;
      grammar_accuracy?: number;
      [key: string]: number | undefined;
    };
    feedback?: string;
    suggested_version?: string;
  };
}

export interface ProgressDTO {
  id?: string;
  status?: string;
  score?: number;
  draft_answers?: Record<string, string>;
  time_left?: number | null;
  results?: ProgressResultItem[];
}

export interface CourseProgressStat {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
}

export interface DashboardStatsDTO {
  total_vocab: number;
  vocab_learned: number;
  overall_progress_pct: number;
  courses: CourseProgressStat[];
}

export interface VocabProgressStatus {
  status: 'seen' | 'learned' | 'mastered';
}

export interface StreakDTO {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  today_active: boolean;
}
