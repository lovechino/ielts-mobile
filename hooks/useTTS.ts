import * as Speech from 'expo-speech';
import { useCallback, useState, useEffect } from 'react';

const PERSONA_CONFIG: Record<string, { lang: string; gender: 'male' | 'female'; pitch: number }> = {
  james: { lang: 'en-GB', gender: 'male', pitch: 0.82 }, // Lower pitch for British male
  dr_chen: { lang: 'en-US', gender: 'male', pitch: 0.80 }, // Lower pitch for US male
  emily: { lang: 'en-AU', gender: 'female', pitch: 1.05 },
  sarah: { lang: 'en-US', gender: 'female', pitch: 1.0 },
};

/**
 * Hook for Text-to-Speech (TTS).
 * Safe implementation with pitch adjustment for gender simulation.
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    // Safe check for getVoicesAsync existence
    const speechAny = Speech as any;
    if (typeof speechAny.getVoicesAsync === 'function') {
      speechAny.getVoicesAsync()
        .then(setAvailableVoices)
        .catch((err: any) => console.warn('[TTS] Failed to get voices:', err));
    }
  }, []);

  const speak = useCallback((text: string, personaId?: string, rate?: number, onDone?: () => void) => {
    setIsSpeaking(true);
    
    const config = personaId ? PERSONA_CONFIG[personaId] : null;
    let voiceIdentifier: string | undefined;

    // Attempt to find a gender-matching voice if available
    if (config && availableVoices.length > 0) {
      const langVoices = availableVoices.filter(v => 
        v.language.toLowerCase().startsWith(config.lang.toLowerCase())
      );
      
      if (langVoices.length > 0) {
        const genderVoice = langVoices.find(v => {
          const name = v.name.toLowerCase();
          if (config.gender === 'male') {
            return name.includes('male') || name.includes('guy') || 
                   name.includes('daniel') || name.includes('alex') || 
                   name.includes('james') || name.includes('david');
          } else {
            return name.includes('female') || name.includes('girl') || 
                   name.includes('samantha') || name.includes('karen');
          }
        });
        voiceIdentifier = genderVoice?.identifier;
      }
    }

    Speech.speak(text, {
      language: config?.lang || 'en-US',
      voice: voiceIdentifier,
      pitch: config?.pitch || 1.0, // Use pitch adjustment for more natural gender feel
      rate: rate ?? 0.85,
      onDone: () => {
        setIsSpeaking(false);
        onDone?.();
      },
      onError: (err) => {
        console.warn('[TTS] Error:', err);
        setIsSpeaking(false);
        onDone?.();
      }
    });
  }, [availableVoices]);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
