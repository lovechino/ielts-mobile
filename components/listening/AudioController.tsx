import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { colors, radius, spacing, shadow } from '@/theme/tokens';

interface Section {
  label: string;
  startTime: number;
  endTime?: number;
  color?: string;
}

interface AudioControllerProps {
  audioUrl: string;
  sections?: Section[];
  examMode?: boolean;
  onTimeUpdate?: (timeMs: number) => void;
  onPlaybackStatusChange?: (isPlaying: boolean) => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function AudioController({ audioUrl, sections, examMode, onTimeUpdate, onPlaybackStatusChange }: AudioControllerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const loadedRef = useRef(false);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    loadedRef.current = false;
    soundRef.current?.unloadAsync();

    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: false },
      (status) => {
        if (!status.isLoaded) return;
        if (!loadedRef.current) {
          loadedRef.current = true;
          setDuration(status.durationMillis ?? 0);
        }
        setPosition(status.positionMillis);
        setIsPlaying(status.isPlaying);
        onTimeUpdate?.(status.positionMillis);
      }
    ).then(({ sound }) => {
      soundRef.current = sound;
    }).catch(() => {});

    return () => { soundRef.current?.unloadAsync(); };
  }, [audioUrl]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, []);

  const seekBackward = useCallback(async () => {
    if (!soundRef.current || examMode) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    const newPos = Math.max(0, status.positionMillis - 10000);
    await soundRef.current.setPositionAsync(newPos);
  }, [examMode]);

  const changeSpeed = useCallback(async () => {
    if (!soundRef.current || examMode) return;
    const speeds = [0.75, 1, 1.25];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    await soundRef.current.setRateAsync(next, true);
  }, [speed, examMode]);

  const progress = duration > 0 ? position / duration : 0;
  const currentSection = sections?.find((s) => position >= s.startTime * 1000 && (!s.endTime || position < s.endTime * 1000));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={seekBackward} style={styles.btn} disabled={examMode}>
          <Text style={[styles.btnText, examMode && styles.disabled]}>◀10</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.seekSection}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            {sections?.map((s, i) => {
              const pct = duration > 0 ? (s.startTime * 1000) / duration : 0;
              return (
                <View key={i} style={[styles.sectionMarker, { left: `${pct * 100}%` }]}>
                  <View style={[styles.sectionTick, { backgroundColor: s.color || colors.outline }]} />
                </View>
              );
            })}
          </View>
          <View style={styles.sectionLabels}>
            {sections?.map((s, i) => {
              const pct = duration > 0 ? (s.startTime * 1000) / duration : 0;
              return (
                <Text key={i} style={[styles.sectionLabel, { left: `${pct * 100}%` }, currentSection?.label === s.label && { color: s.color || colors.primary, fontWeight: '700' }]}>
                  {s.label}
                </Text>
              );
            })}
          </View>
        </View>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <TouchableOpacity onPress={changeSpeed} style={styles.btn} disabled={examMode}>
          <Text style={[styles.btnText, examMode && styles.disabled]}>{speed}x</Text>
        </TouchableOpacity>
      </View>
      {currentSection && (
        <Text style={styles.sectionActive}>{currentSection.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadow.card,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  btnText: { fontSize: 13, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  disabled: { opacity: 0.4 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 18, color: '#fff' },
  seekSection: { flex: 1, gap: 2 },
  track: { height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'visible', position: 'relative' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  sectionMarker: { position: 'absolute', top: -2, width: 2 },
  sectionTick: { width: 2, height: 10, borderRadius: 1 },
  sectionLabels: { height: 14, position: 'relative' },
  sectionLabel: { position: 'absolute', fontSize: 9, color: colors.textMuted, fontWeight: '600', transform: [{ translateX: -12 }], width: 40, textAlign: 'center' },
  time: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', fontVariant: ['tabular-nums'], minWidth: 40, textAlign: 'right' },
  sectionActive: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: spacing.xs, textAlign: 'center' },
});
