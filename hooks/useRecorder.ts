import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

/**
 * useRecorder — quản lý Audio.Recording lifecycle an toàn.
 *
 * Fixes:
 * - Cleanup recording cũ trước khi tạo mới (tránh "Only one Recording at a time")
 * - Cleanup khi component unmount
 */
export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [meteringValue, setMeteringValue] = useState(-160);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  /** Force unload bất kỳ recording nào đang tồn tại */
  const forceCleanup = useCallback(async () => {
    if (recordingRef.current) {
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        } else {
          await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        }
      } catch {
        // Ignore — đã unload hoặc không còn valid
      }
      recordingRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    console.log('[Recorder] startRecording called');
    try {
      // 1. Cleanup recording cũ nếu còn tồn tại
      await forceCleanup();

      // 2. Request permissions
      console.log('[Recorder] Requesting permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // 3. Set audio mode
      console.log('[Recorder] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 4. Tạo và chuẩn bị recording mới
      console.log('[Recorder] Preparing new Recording...');
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          },
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            setMeteringValue(status.metering);
          }
        },
        100 // progress update interval ms
      );

      recordingRef.current = recording;
      setIsRecording(true);
      console.log('[Recorder] Recording started');
    } catch (error) {
      console.error('[Recorder] Failed to start recording:', error);
      await forceCleanup();
      setIsRecording(false);
    }
  }, [forceCleanup]);

  const stopRecording = useCallback(async (): Promise<string | undefined> => {
    console.log('[Recorder] stopRecording called');
    if (!recordingRef.current) {
      console.warn('[Recorder] No active recording to stop');
      return undefined;
    }
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log('[Recorder] Stopped, URI:', uri);
      recordingRef.current = null;
      setIsRecording(false);
      setMeteringValue(-160);

      // Reset audio mode sau khi xong
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      }).catch(() => {});

      return uri ?? undefined;
    } catch (error) {
      console.error('[Recorder] Failed to stop:', error);
      recordingRef.current = null;
      setIsRecording(false);
      return undefined;
    }
  }, []);

  return { startRecording, stopRecording, isRecording, meteringValue };
}
