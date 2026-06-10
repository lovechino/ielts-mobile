import { useEffect, useRef, useCallback, useState } from 'react';

export interface SilenceEvent {
  /** Thời điểm bắt đầu im lặng (ms từ epoch) */
  startMs: number;
  /** Thời điểm kết thúc im lặng (ms từ epoch) */
  endMs: number;
  /** Thời lượng im lặng (ms) */
  durationMs: number;
}

export type SilencePenalty = 'none' | 'mild' | 'significant';

export function getSilencePenalty(durationMs: number): SilencePenalty {
  if (durationMs >= 4000) return 'significant'; // > 4s: trừ điểm rõ Fluency & Coherence
  if (durationMs >= 2000) return 'mild';         // 2–4s: trừ điểm nhẹ Fluency
  return 'none';                                  // < 2s: bình thường
}

type VADOptions = {
  meteringValue: number;
  isRecording: boolean;
  /** Callback mỗi khi một khoảng lặng kết thúc (voice resumed sau silence) */
  onSilenceLogged?: (event: SilenceEvent) => void;
  /** Ngưỡng dB để xác định im lặng. Default: -50 dBFS */
  silenceThreshold?: number;
  /** Thời gian tối thiểu để tính là một khoảng lặng đáng kể. Default: 500ms */
  minSilenceDurationMs?: number;
};

/**
 * useVAD — Voice Activity Detection hook.
 *
 * KHÔNG tự động nộp bài. Chỉ đo và log khoảng lặng để bổ trợ chấm điểm Fluency.
 *
 * Quy tắc penalty (theo tiêu chí IELTS):
 *   < 2s   → none       (suy nghĩ tự nhiên)
 *   2–4s   → mild       (trừ nhẹ Fluency)
 *   > 4s   → significant (trừ rõ Fluency & Coherence)
 */
export function useVAD({
  meteringValue,
  isRecording,
  onSilenceLogged,
  silenceThreshold = -50,
  minSilenceDurationMs = 500,
}: VADOptions) {
  const [currentSilenceMs, setCurrentSilenceMs] = useState(0);
  const silenceStartRef = useRef<number | null>(null);
  const isSilentRef = useRef(false);

  // Reset khi dừng ghi âm
  useEffect(() => {
    if (!isRecording) {
      silenceStartRef.current = null;
      isSilentRef.current = false;
      setCurrentSilenceMs(0);
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;

    const now = Date.now();

    if (meteringValue < silenceThreshold) {
      // Bắt đầu hoặc tiếp tục tracking khoảng lặng
      if (!isSilentRef.current) {
        isSilentRef.current = true;
        silenceStartRef.current = now;
      } else if (silenceStartRef.current !== null) {
        setCurrentSilenceMs(now - silenceStartRef.current);
      }
    } else {
      // Tiếng nói quay lại — kết thúc khoảng lặng
      if (isSilentRef.current && silenceStartRef.current !== null) {
        const durationMs = now - silenceStartRef.current;
        if (durationMs >= minSilenceDurationMs) {
          const event: SilenceEvent = {
            startMs: silenceStartRef.current,
            endMs: now,
            durationMs,
          };
          onSilenceLogged?.(event);
        }
      }
      isSilentRef.current = false;
      silenceStartRef.current = null;
      setCurrentSilenceMs(0);
    }
  }, [meteringValue, isRecording, silenceThreshold, minSilenceDurationMs, onSilenceLogged]);

  return { currentSilenceMs };
}
