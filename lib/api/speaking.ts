import { apiFetch } from './client';

export interface GrammarError {
  original: string;
  corrected: string;
  explanation_vi: string;
}

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
  transition_to_part?: number; // New field for orchestration
  // New detailed fields:
  evaluation_metadata?: {
    total_sentences: number;
    error_free_sentences_count: number;
    fillers_count: number;
  };
  grammar_errors?: GrammarError[];
  advanced_vocab_used?: string[];
  feedback_vi?: {
    strengths: string;
    weaknesses: string;
    action_plan: string;
  };
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

export const startSession = (body: { personaId: string; topic: string; part: number; lesson_id?: string }) =>
  apiFetch<{ sessionId: string; opening_question: string; current_part?: number; cue_card_text?: string | null; parts?: number[] }>('/speaking/session/start', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export interface SubmitTurnSilenceMetadata {
  totalSilenceMs: number;
  mildPauseCount: number;
  significantPauseCount: number;
}

export const submitTurn = (body: {
  sessionId: string;
  audio: string;
  format: string;
  silenceMetadata?: SubmitTurnSilenceMetadata;
}) =>
  apiFetch<ExaminerFeedback>('/speaking/session/turn', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export interface EndSessionResult {
  /** Premium: kết quả ngay */
  report?: SessionReport;
  /** Free: deferred */
  scoring_mode?: 'immediate' | 'deferred';
  average_band?: number;
  report_available_at?: string;
  estimated_wait_minutes?: number;
  message?: string;
}

export const endSession = (sessionId: string) =>
  apiFetch<EndSessionResult>('/speaking/session/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });

export const unlockSpeakingReport = (sessionId: string) =>
  apiFetch<{ unlocked: boolean; already_unlocked?: boolean; report: SessionReport | null }>(
    `/speaking/sessions/${sessionId}/unlock`,
    { method: 'POST', body: JSON.stringify({}) }
  );

export const getSessions = () =>
  apiFetch<{ sessions: any[] }>('/speaking/sessions');

export const fetchSpeakingSession = (sessionId: string) =>
  apiFetch<any>(`/speaking/sessions/${sessionId}`);
