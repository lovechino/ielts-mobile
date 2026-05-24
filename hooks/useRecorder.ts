import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [meteringValue, setMeteringValue] = useState(-160);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) {
            setMeteringValue(status.metering ?? -160);
          }
        },
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {}
  }, []);

  const stopRecording = useCallback(async (): Promise<string | undefined> => {
    try {
      if (!recordingRef.current) return undefined;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setMeteringValue(-160);
      return uri ?? undefined;
    } catch {
      return undefined;
    }
  }, []);

  return { startRecording, stopRecording, isRecording, meteringValue };
}
