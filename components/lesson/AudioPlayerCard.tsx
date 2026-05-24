import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WaveformDecor } from './WaveformDecor';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type AudioPlayerCardProps = {
  uri?: string | null;
};

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function AudioPlayerCard({ uri }: AudioPlayerCardProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function togglePlay() {
    if (!uri) return;
    try {
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (!status.isLoaded) return;
            setPosition(status.positionMillis);
            setDuration(status.durationMillis ?? 0);
            setPlaying(status.isPlaying);
          }
        );
        soundRef.current = sound;
        setPlaying(true);
      } else {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setPlaying(true);
        }
      }
    } catch {
      setPlaying(false);
    }
  }

  const progress = duration > 0 ? position / duration : 0;
  const remaining = duration - position;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable style={styles.playBtn} onPress={togglePlay} disabled={!uri}>
          <Feather name={playing ? 'pause' : 'play'} size={22} color={colors.white} />
        </Pressable>
        <View style={styles.times}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.time}>-{formatTime(remaining)}</Text>
        </View>
      </View>
      <WaveformDecor progress={progress} />
      {!uri ? <Text style={styles.hint}>No audio file for this lesson</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  times: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  time: { fontSize: 12, color: colors.textSecondary, minWidth: 44 },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: { height: '100%', backgroundColor: colors.accent },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
});
