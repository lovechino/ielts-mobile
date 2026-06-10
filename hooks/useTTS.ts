import * as Speech from 'expo-speech';
import { useCallback, useState, useEffect, useRef } from 'react';

// ─── Persona Configuration ────────────────────────────────────────────────────

export type AccentCode = 'en-GB' | 'en-AU' | 'en-US' | 'en-IE' | 'en-NZ';

export interface PersonaVoiceConfig {
  /** BCP-47 language tag — xác định accent */
  lang: AccentCode;
  gender: 'male' | 'female';
  /** Pitch multiplier. 1.0 = default, <1 = thấp hơn, >1 = cao hơn */
  pitch: number;
  /** Tốc độ nói mặc định cho persona này */
  rate: number;
  /**
   * Danh sách tên voice ưu tiên theo thứ tự.
   * Tên khớp (contains, case-insensitive) sẽ được chọn trước.
   * iOS: "Daniel", "Karen", "Moira", "Rishi"
   * Android: tên TTS engine khác nhau — dùng fallback gender nếu miss
   */
  preferredVoiceNames: string[];
}

export const PERSONA_CONFIGS: Record<string, PersonaVoiceConfig> = {
  james: {
    lang: 'en-GB',
    gender: 'male',
    pitch: 0.82,
    rate: 0.85,
    preferredVoiceNames: ['daniel', 'oliver', 'arthur', 'james'],
  },
  emily: {
    lang: 'en-AU',
    gender: 'female',
    pitch: 1.05,
    rate: 0.87,
    preferredVoiceNames: ['karen', 'catherine', 'lee', 'emily'],
  },
  dr_chen: {
    lang: 'en-US',
    gender: 'male',
    pitch: 0.80,
    rate: 0.83,
    preferredVoiceNames: ['alex', 'fred', 'tom', 'david', 'aaron'],
  },
  sarah: {
    lang: 'en-US',
    gender: 'female',
    pitch: 1.0,
    rate: 0.88,
    preferredVoiceNames: ['samantha', 'victoria', 'allison', 'ava', 'susan'],
  },
};

// ─── Voice Selection Logic ────────────────────────────────────────────────────

/**
 * Chọn voice tốt nhất cho một persona theo thứ tự ưu tiên:
 * 1. Voice khớp tên ưu tiên + đúng ngôn ngữ
 * 2. Bất kỳ voice nào đúng ngôn ngữ (lang prefix match)
 * 3. Bất kỳ voice nào thuộc nhóm en-* (English fallback)
 * 4. undefined — để hệ thống tự chọn
 */
function selectVoice(
  voices: Speech.Voice[],
  config: PersonaVoiceConfig,
): string | undefined {
  if (voices.length === 0) return undefined;

  const langLower = config.lang.toLowerCase();

  // Pool 1: voices khớp ngôn ngữ chính xác (en-GB, en-AU, en-US...)
  const exactLangVoices = voices.filter(v =>
    v.language.toLowerCase().startsWith(langLower),
  );

  // Pool 2: bất kỳ English voice nào (fallback)
  const englishVoices = voices.filter(v =>
    v.language.toLowerCase().startsWith('en'),
  );

  const pool = exactLangVoices.length > 0 ? exactLangVoices : englishVoices;
  if (pool.length === 0) return undefined;

  // Tìm theo tên ưu tiên (trong pool ngôn ngữ)
  for (const preferred of config.preferredVoiceNames) {
    const match = pool.find(v => v.name.toLowerCase().includes(preferred));
    if (match) return match.identifier;
  }

  // Fallback: tìm theo gender keyword phổ biến
  const genderKeywords =
    config.gender === 'male'
      ? ['male', 'guy', 'man', 'daniel', 'alex', 'james', 'david', 'thomas', 'oliver']
      : ['female', 'girl', 'woman', 'samantha', 'karen', 'victoria', 'allison', 'ava'];

  const genderMatch = pool.find(v => {
    const name = v.name.toLowerCase();
    return genderKeywords.some(kw => name.includes(kw));
  });
  if (genderMatch) return genderMatch.identifier;

  // Fallback cuối: lấy voice đầu tiên trong pool ngôn ngữ đúng
  return exactLangVoices[0]?.identifier ?? englishVoices[0]?.identifier;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TTSSpeakOptions {
  /** Override rate mặc định của persona */
  rate?: number;
  /** Callback khi TTS xong hoặc bị lỗi */
  onDone?: () => void;
}

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  // Cache voice identifier để không tính lại mỗi lần speak
  const voiceCacheRef = useRef<Map<string, string | undefined>>(new Map());

  useEffect(() => {
    const speechAny = Speech as any;
    if (typeof speechAny.getVoicesAsync === 'function') {
      speechAny
        .getVoicesAsync()
        .then((voices: Speech.Voice[]) => {
          setAvailableVoices(voices);
          // Invalidate cache khi voices thay đổi
          voiceCacheRef.current.clear();
        })
        .catch((err: any) =>
          console.warn('[TTS] Failed to get voices:', err),
        );
    }
  }, []);

  /**
   * Đọc văn bản với giọng của persona được chỉ định.
   *
   * @param text       - Nội dung cần đọc
   * @param personaId  - ID persona (james | emily | dr_chen | sarah)
   * @param options    - Override rate hoặc callback onDone
   */
  const speak = useCallback(
    (text: string, personaId?: string, options?: TTSSpeakOptions | number, onDone?: () => void) => {
      setIsSpeaking(true);

      const config = personaId ? PERSONA_CONFIGS[personaId] : null;

      // Backward-compat: options có thể là number (rate) từ call cũ
      let rate: number | undefined;
      let doneCallback: (() => void) | undefined;
      if (typeof options === 'number') {
        rate = options;
        doneCallback = onDone;
      } else {
        rate = options?.rate;
        doneCallback = options?.onDone ?? onDone;
      }

      // Lấy voice từ cache hoặc tính mới
      let voiceIdentifier: string | undefined;
      if (config && availableVoices.length > 0) {
        const cacheKey = personaId!;
        if (!voiceCacheRef.current.has(cacheKey)) {
          voiceCacheRef.current.set(cacheKey, selectVoice(availableVoices, config));
        }
        voiceIdentifier = voiceCacheRef.current.get(cacheKey);
      }

      Speech.speak(text, {
        language: config?.lang ?? 'en-US',
        voice: voiceIdentifier,
        pitch: config?.pitch ?? 1.0,
        rate: rate ?? config?.rate ?? 0.85,
        onDone: () => {
          setIsSpeaking(false);
          doneCallback?.();
        },
        onError: (err) => {
          console.warn('[TTS] Error:', err);
          setIsSpeaking(false);
          doneCallback?.();
        },
      });
    },
    [availableVoices],
  );

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, availableVoices };
}
