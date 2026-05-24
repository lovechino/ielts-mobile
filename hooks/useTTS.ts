import * as Speech from 'expo-speech';
import { useCallback } from 'react';

export function useTTS() {
  const speak = useCallback((text: string, personaId?: string, rate?: number, onDone?: () => void) => {
    Speech.speak(text, {
      language: personaId === 'james' ? 'en-GB' : personaId === 'emily' ? 'en-AU' : 'en-US',
      rate: rate ?? 0.85,
      onDone,
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
  }, []);

  return { speak, stop };
}
