import { apiFetch } from './client';

export interface ExaminerFeedback {
  transcript?: string;
  response: string;
  feedback: string;
  band_estimate: number;
  fluency: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
  correction: string | null;
  next_question: string | null;
}

export interface SessionReport {
  sessionId: string;
  persona: string;
  duration: number;
  turnsCompleted: number;
  averageBandEstimate: number;
  breakdown: { fluency: number; lexicalResource: number; grammaticalRange: number; pronunciation: number };
  topErrors: Array<{ type: string; example: string; correction: string }>;
  nextSessionSuggestion: string;
}

export const startSession = (body: { personaId: string; topic: string; part: number }) =>
  apiFetch<{ sessionId: string; opening_question: string }>('/speaking/session/start', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const submitTurn = (body: { sessionId: string; audio: string; format: string }) =>
  apiFetch<ExaminerFeedback>('/speaking/session/turn', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const endSession = (sessionId: string) =>
  apiFetch<{ report: SessionReport }>('/speaking/session/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });

export const getSessions = () =>
  apiFetch<{ sessions: any[] }>('/speaking/sessions');
