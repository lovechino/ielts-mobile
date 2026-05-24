import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type PremiumCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  imageUri?: string;
  onPress?: () => void;
};

export function PremiumCard({ title, description, buttonLabel, imageUri, onPress }: PremiumCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bgShape} />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PREMIUM</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
        <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    position: 'relative',
  },
  bgShape: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: { position: 'relative', zIndex: 10, gap: spacing.md, alignItems: 'flex-start' },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '600', color: '#fff' },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  btn: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onSecondaryContainer },
  image: { position: 'absolute', top: 0, right: 0, height: '100%', width: '33%', opacity: 0.2 },
});
