import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AIInference } from '@/lib/offline/aiInference';
import { AssetManager } from '@/lib/offline/assetManager';

export interface STTHook {
  partialText: string;
  finalText: string;
  isRecognizing: boolean;
  error: string | null;
  mode: 'native' | 'offline';
  startSTT: (lang?: string) => Promise<void>;
  stopSTT: (audioUri?: string) => Promise<void>;
  cancelSTT: () => Promise<void>;
  resetSTT: () => void;
}

/**
 * useSTT — Hybrid Speech-to-Text hook.
 * Ưu tiên Offline AI (Tier 2) nếu đã tải model, fallback về Native (Tier 1).
 */
export function useSTT(): STTHook {
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'native' | 'offline'>('native');
  
  const isStartedRef = useRef(false);

  // Kiểm tra mode khi mount hoặc khi model được tải
  useEffect(() => {
    const checkMode = async () => {
      const status = await AssetManager.getStatus('whisper-tiny-en');
      setMode(status.isDownloaded ? 'offline' : 'native');
    };
    checkMode();
  }, []);

  useEffect(() => {
    if (mode === 'native') {
      Voice.onSpeechStart = () => { setIsRecognizing(true); setError(null); };
      Voice.onSpeechEnd = () => { setIsRecognizing(false); };
      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        console.warn('[STT] Native Error:', e);
        setError(e.error?.message || 'Speech recognition error');
        setIsRecognizing(false);
      };
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) setFinalText(e.value[0]);
      };
      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) setPartialText(e.value[0]);
      };
    }

    return () => {
      if (mode === 'native') {
        Voice.destroy().then(Voice.removeAllListeners);
      } else if (mode === 'offline') {
        AIInference.releaseSession('whisper-tiny-en');
      }
    };
  }, [mode]);

  const startSTT = useCallback(async (lang: string = 'en-US') => {
    try {
      setPartialText('');
      setFinalText('');
      setError(null);
      
      if (mode === 'offline') {
        console.log('[STT] Starting Offline AI Mode...');
        setIsRecognizing(true);
        // Offline mode thường xử lý sau khi có buffer/file
        // hoặc chạy stream qua ONNX. Ở đây ta mark là đang nhận diện.
      } else {
        await Voice.stop();
        await Voice.start(lang);
      }
      isStartedRef.current = true;
    } catch (e: any) {
      console.error('[STT] Failed to start:', e);
      setError(e.message);
    }
  }, [mode]);

  const stopSTT = useCallback(async (audioUri?: string) => {
    try {
      if (mode === 'offline' && audioUri) {
        setIsRecognizing(false);
        const result = await AIInference.runWhisper(audioUri);
        setFinalText(result);
        setPartialText(result);
      } else if (mode === 'native') {
        await Voice.stop();
      }
      isStartedRef.current = false;
      setIsRecognizing(false);
    } catch (e: any) {
      console.error('[STT] Failed to stop:', e);
    }
  }, [mode]);

  const cancelSTT = useCallback(async () => {
    try {
      if (mode === 'native') await Voice.cancel();
      setPartialText('');
      setFinalText('');
      isStartedRef.current = false;
      setIsRecognizing(false);
    } catch (e: any) {
      console.error('[STT] Failed to cancel:', e);
    }
  }, [mode]);

  const resetSTT = useCallback(() => {
    setPartialText('');
    setFinalText('');
    setError(null);
  }, []);

  return {
    partialText,
    finalText,
    isRecognizing,
    error,
    mode,
    startSTT,
    stopSTT,
    cancelSTT,
    resetSTT,
  };
}
