import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';

function parseBullets(content: string): string[] {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[-*]\s*/, '').replace(/^-\s*/, ''));
}

export function CueCard({ topic }: { topic: string }) {
  const lines = parseBullets(topic);
  const mainQuestion = lines[0] || topic;
  const bullets = lines.slice(1).filter((l) => l.length > 0);

  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <FontAwesome name="microphone" size={12} color="#fff" />
        <Text style={styles.badgeText}>PART 2 — CUE CARD</Text>
      </View>

      <Text style={styles.instruction}>You will have to talk about the topic for 1 to 2 minutes.</Text>
      <Text style={styles.instruction}>You have 1 minute to think about what you are going to say.</Text>

      <View style={styles.divider} />

      <Text style={styles.question}>{mainQuestion}</Text>

      {bullets.length > 0 && (
        <View style={styles.bulletList}>
          <Text style={styles.bulletHint}>You should say:</Text>
          {bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    ...shadow.card,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  instruction: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eceef0',
    marginVertical: spacing.md,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  bulletList: {
    gap: 6,
  },
  bulletHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 20,
    width: 12,
  },
  bulletText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
});
