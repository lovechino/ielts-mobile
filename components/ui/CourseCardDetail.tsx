import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type CourseCardDetailProps = {
  imageUri: string;
  badgeLabel: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonColor?: string;
  onPress?: () => void;
};

export function CourseCardDetail({ imageUri, badgeLabel, title, description, buttonLabel, buttonColor, onPress }: CourseCardDetailProps) {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <View style={[styles.badge, { backgroundColor: buttonColor || colors.secondary }]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
            <Text style={styles.overlayTitle}>{title}</Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.desc}>{description}</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: buttonColor || colors.secondary }]} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(216,226,255,0.3)',
  },
  imageWrap: { height: 192, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  overlayContent: { gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    borderRadius: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  overlayTitle: { fontSize: 20, fontWeight: '600', color: '#fff' },
  body: { padding: spacing.md, gap: spacing.md },
  desc: { fontSize: 14, color: colors.textSecondary },
  btn: { paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
