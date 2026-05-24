import { create } from 'zustand';
import type { PassageDTO, QuestionDTO, QuestionGroupDTO, ProgressResultItem } from '@/lib/api/types';

export interface GroupedQuestion {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
}

export interface TestStoreState {
  lessonId: string | null;
  lessonTitle: string;
  passages: PassageDTO[];
  groups: GroupedQuestion[];
  answers: Record<string, string>;
  remainingSeconds: number;
  totalSeconds: number;
  currentGroupIndex: number;
  isSubmitting: boolean;
  isCompleted: boolean;
  results: ProgressResultItem[] | null;
  score: number | null;

  initLesson: (lessonId: string, title: string, passages: PassageDTO[], groups: GroupedQuestion[], timeLimitMinutes: number) => void;
  setAnswer: (questionId: string, answer: string) => void;
  decrementTime: () => void;
  setCurrentGroup: (index: number) => void;
  setSubmitting: (v: boolean) => void;
  setCompleted: (results: ProgressResultItem[], score: number) => void;
  getGroupAnswers: (groupId: string) => Record<string, string>;
  getAllQuestions: () => QuestionDTO[];
  getAnsweredCount: () => number;
  getTotalCount: () => number;
  resetStore: () => void;
}

export const useTestStore = create<TestStoreState>((set, get) => ({
  lessonId: null,
  lessonTitle: '',
  passages: [],
  groups: [],
  answers: {},
  remainingSeconds: 0,
  totalSeconds: 0,
  currentGroupIndex: 0,
  isSubmitting: false,
  isCompleted: false,
  results: null,
  score: null,

  initLesson: (lessonId, title, passages, groups, timeLimitMinutes) =>
    set({
      lessonId,
      lessonTitle: title,
      passages,
      groups,
      answers: {},
      remainingSeconds: timeLimitMinutes * 60,
      totalSeconds: timeLimitMinutes * 60,
      currentGroupIndex: 0,
      isSubmitting: false,
      isCompleted: false,
      results: null,
      score: null,
    }),

  setAnswer: (questionId, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),

  decrementTime: () =>
    set((s) => ({ remainingSeconds: Math.max(0, s.remainingSeconds - 1) })),

  setCurrentGroup: (index) => set({ currentGroupIndex: index }),

  setSubmitting: (v) => set({ isSubmitting: v }),

  setCompleted: (results, score) =>
    set({ isCompleted: true, results, score, isSubmitting: false }),

  getGroupAnswers: (groupId) => {
    const { answers, groups } = get();
    const group = groups.find((g) => g.group.id === groupId);
    if (!group) return {};
    const result: Record<string, string> = {};
    group.questions.forEach((q) => {
      if (answers[q.id]) result[q.id] = answers[q.id];
    });
    return result;
  },

  getAllQuestions: () => {
    const { groups } = get();
    return groups.flatMap((g) => g.questions);
  },

  getAnsweredCount: () => {
    return Object.keys(get().answers).length;
  },

  getTotalCount: () => {
    return get().getAllQuestions().length;
  },

  resetStore: () =>
    set({
      lessonId: null,
      lessonTitle: '',
      passages: [],
      groups: [],
      answers: {},
      remainingSeconds: 0,
      totalSeconds: 0,
      currentGroupIndex: 0,
      isSubmitting: false,
      isCompleted: false,
      results: null,
      score: null,
    }),
}));
