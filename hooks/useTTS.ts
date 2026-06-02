import * as Speech from 'expo-speech';
import { useCallback, useState } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, personaId?: string, rate?: number, onDone?: () => void) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: personaId === 'james' ? 'en-GB' : personaId === 'emily' ? 'en-AU' : 'en-US',
      rate: rate ?? 0.85,
      onDone: () => {
        setIsSpeaking(false);
        onDone?.();
      },
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
