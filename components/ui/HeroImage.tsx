import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type HeroImageProps = {
  uri: string;
  badgeLabel?: string;
  badgeBgColor?: string;
  title: string;
};

export function HeroImage({ uri, badgeLabel, badgeBgColor, title }: HeroImageProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={styles.content}>
          {badgeLabel && (
            <View style={[styles.badge, { backgroundColor: badgeBgColor || colors.tertiary }]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  content: { gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '600', color: '#fff' },
});
