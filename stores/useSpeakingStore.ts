import { create } from 'zustand';
import type { ExaminerFeedback, SessionReport } from '@/lib/api/speaking';

export type SpeakingAppState = 'idle' | 'loading' | 'speaking' | 'listening' | 'processing' | 'hesitation' | 'completed';

interface SpeakingState {
  sessionId: string | null;
  currentPersonaId: string;
  appState: SpeakingAppState;
  lastFeedback: ExaminerFeedback | null;
  countdown: number;
  turns: ExaminerFeedback[];
  report: SessionReport | null;
  prefilledTopic: string;
  prefilledPart: number;
  setSessionId: (id: string | null) => void;
  setCurrentPersonaId: (id: string) => void;
  setAppState: (state: SpeakingAppState) => void;
  setFeedback: (feedback: ExaminerFeedback) => void;
  setCountdown: (sec: number) => void;
  setReport: (report: SessionReport | null) => void;
  addTurn: (turn: ExaminerFeedback) => void;
  setPrefill: (topic: string, part: number) => void;
  resetStore: () => void;
}

export const useSpeakingStore = create<SpeakingState>((set) => ({
  sessionId: null,
  currentPersonaId: 'james',
  appState: 'idle',
  lastFeedback: null,
  countdown: 10,
  turns: [],
  report: null,
  prefilledTopic: '',
  prefilledPart: 1,

  setSessionId: (id) => set({ sessionId: id }),
  setCurrentPersonaId: (id) => set({ currentPersonaId: id }),
  setAppState: (state) => set({ appState: state }),
  setFeedback: (feedback) => set({ lastFeedback: feedback }),
  setCountdown: (sec) => set({ countdown: sec }),
  setReport: (report) => set({ report }),
  addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn] })),
  setPrefill: (topic, part) => set({ prefilledTopic: topic, prefilledPart: part }),
  resetStore: () => set({
    sessionId: null,
    appState: 'idle',
    lastFeedback: null,
    countdown: 10,
    turns: [],
    report: null,
    prefilledTopic: '',
    prefilledPart: 1,
  }),
}));
