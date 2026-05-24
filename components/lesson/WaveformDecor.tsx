import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

type WaveformDecorProps = {
  progress?: number;
};

export function WaveformDecor({ progress = 0.5 }: WaveformDecorProps) {
  const bars = [12, 20, 16, 28, 14, 24, 18, 30, 12, 22, 16, 26, 14, 20, 12];
  const split = Math.floor(bars.length * progress);

  return (
    <View style={styles.row}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: h },
            i < split ? styles.played : styles.upcoming,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 36,
    marginTop: spacing.md,
    gap: 3,
  },
  bar: { flex: 1, borderRadius: 2, minWidth: 4 },
  played: { backgroundColor: colors.accent },
  upcoming: { backgroundColor: colors.border },
});
