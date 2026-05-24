import { useEffect, useRef } from 'react';

type VADOptions = {
  meteringValue: number;
  isRecording: boolean;
  onSilenceDetected: () => void;
  onVoiceResumed: () => void;
  silenceThreshold?: number;
  silenceDurationMs?: number;
};

export function useVAD({
  meteringValue,
  isRecording,
  onSilenceDetected,
  onVoiceResumed,
  silenceThreshold = -50,
  silenceDurationMs = 1500,
}: VADOptions) {
  const silenceStartRef = useRef<number | null>(null);
  const wasSilentRef = useRef(false);

  useEffect(() => {
    if (!isRecording) {
      silenceStartRef.current = null;
      wasSilentRef.current = false;
      return;
    }

    if (meteringValue < silenceThreshold) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = Date.now();
      } else if (Date.now() - silenceStartRef.current >= silenceDurationMs) {
        if (!wasSilentRef.current) {
          wasSilentRef.current = true;
          onSilenceDetected();
        }
      }
    } else {
      silenceStartRef.current = null;
      if (wasSilentRef.current) {
        wasSilentRef.current = false;
        onVoiceResumed();
      }
    }
  }, [meteringValue, isRecording, silenceThreshold, silenceDurationMs, onSilenceDetected, onVoiceResumed]);
}
