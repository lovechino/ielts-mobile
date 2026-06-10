import { create } from 'zustand';
import type { ExaminerFeedback, SessionReport } from '@/lib/api/speaking';
import type { SilenceEvent } from '@/hooks/useVAD';

export type SpeakingAppState = 'idle' | 'loading' | 'speaking' | 'listening' | 'processing' | 'hesitation' | 'preparing' | 'recording' | 'completed';

export interface SilenceMetadata {
  /** Danh sách các khoảng lặng đã log trong lượt nói hiện tại */
  events: SilenceEvent[];
  /** Tổng thời gian im lặng (ms) */
  totalSilenceMs: number;
  /** Số khoảng lặng nhẹ (2–4s) */
  mildPauseCount: number;
  /** Số khoảng lặng nặng (>4s) */
  significantPauseCount: number;
}

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
  /** Khoảng lặng trong lượt nói hiện tại — reset sau mỗi lần submit */
  currentTurnSilence: SilenceMetadata;
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
  /** Thêm một khoảng lặng vào log của lượt nói hiện tại */
  addSilenceEvent: (event: SilenceEvent) => void;
  /** Reset silence log — gọi sau khi submit mỗi lượt nói */
  resetSilenceLog: () => void;
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
  currentTurnSilence: {
    events: [],
    totalSilenceMs: 0,
    mildPauseCount: 0,
    significantPauseCount: 0,
  },

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

  addSilenceEvent: (event) => set((state) => {
    const penalty = event.durationMs >= 4000 ? 'significant' : event.durationMs >= 2000 ? 'mild' : 'none';
    return {
      currentTurnSilence: {
        events: [...state.currentTurnSilence.events, event],
        totalSilenceMs: state.currentTurnSilence.totalSilenceMs + event.durationMs,
        mildPauseCount: state.currentTurnSilence.mildPauseCount + (penalty === 'mild' ? 1 : 0),
        significantPauseCount: state.currentTurnSilence.significantPauseCount + (penalty === 'significant' ? 1 : 0),
      },
    };
  }),

  resetSilenceLog: () => set({
    currentTurnSilence: {
      events: [],
      totalSilenceMs: 0,
      mildPauseCount: 0,
      significantPauseCount: 0,
    },
  }),

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
    currentTurnSilence: {
      events: [],
      totalSilenceMs: 0,
      mildPauseCount: 0,
      significantPauseCount: 0,
    },
  }),
}));
