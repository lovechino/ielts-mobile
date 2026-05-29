import { create } from 'zustand';
import type { ExaminerFeedback, SessionReport } from '@/lib/api/speaking';

export type SpeakingAppState = 'idle' | 'loading' | 'speaking' | 'listening' | 'processing' | 'hesitation' | 'preparing' | 'recording' | 'completed';

interface SpeakingState {
  sessionId: string | null;
  currentPersonaId: string;
  appState: SpeakingAppState;
  lastFeedback: ExaminerFeedback | null;
  countdown: number;
  turns: ExaminerFeedback[];
  report: SessionReport | null;
  
  // Multi-part fields
  prefilledTopic: string;
  prefilledPart: number; // legacy
  lessonParts: number[]; // e.g. [1, 2, 3]
  currentPartIndex: number;
  fullContent: any; // Pre-loaded JSON from lesson.content
  
  prepTimeLeft: number;
  setSessionId: (id: string | null) => void;
  setCurrentPersonaId: (id: string) => void;
  setAppState: (state: SpeakingAppState) => void;
  setFeedback: (feedback: ExaminerFeedback) => void;
  setCountdown: (sec: number) => void;
  setReport: (report: SessionReport | null) => void;
  addTurn: (turn: ExaminerFeedback) => void;
  
  // Multi-part setters
  setPrefill: (topic: string, part: number, parts?: number[], content?: any) => void;
  setPartIndex: (index: number) => void;
  
  setPrepTimeLeft: (sec: number) => void;
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
  lessonParts: [1],
  currentPartIndex: 0,
  fullContent: null,
  
  prepTimeLeft: 60,

  setSessionId: (id) => set({ sessionId: id }),
  setCurrentPersonaId: (id) => set({ currentPersonaId: id }),
  setAppState: (state) => set({ appState: state }),
  setFeedback: (feedback) => set({ lastFeedback: feedback }),
  setCountdown: (sec) => set({ countdown: sec }),
  setReport: (report) => set({ report }),
  addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn] })),
  
  setPrefill: (topic, part, parts, content) => set({ 
    prefilledTopic: topic, 
    prefilledPart: part,
    lessonParts: parts || [part],
    currentPartIndex: 0,
    fullContent: content || null
  }),
  setPartIndex: (index) => set({ currentPartIndex: index }),
  
  setPrepTimeLeft: (sec) => set({ prepTimeLeft: sec }),
  resetStore: () => set({
    sessionId: null,
    appState: 'idle',
    lastFeedback: null,
    countdown: 10,
    turns: [],
    report: null,
    prefilledTopic: '',
    prefilledPart: 1,
    lessonParts: [1],
    currentPartIndex: 0,
    fullContent: null,
    prepTimeLeft: 60,
  }),
}));
