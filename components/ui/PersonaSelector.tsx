import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

type PersonaItem = {
  id: string;
  name: string;
  avatarUri: string;
  accent?: string;
  description?: string;
  color?: string;
  isPremium?: boolean;
};

type PersonaSelectorProps = {
  personas: PersonaItem[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function PersonaSelector({ personas, selectedId, onSelect }: PersonaSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {personas.map((p) => {
        const active = selectedId === p.id;
        return (
          <PersonaCard
            key={p.id}
            persona={p}
            active={active}
            onSelect={() => onSelect(p.id)}
          />
        );
      })}
    </ScrollView>
  );
}

function PersonaCard({ persona: p, active, onSelect }: { persona: PersonaItem, active: boolean, onSelect: () => void }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(active ? 1.05 : 1) }],
    borderColor: withSpring(active ? p.color || colors.primary : colors.border),
  }));

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.9}>
      <Animated.View style={[styles.card, animatedStyle, active && styles.cardActive]}>
        {p.isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: p.color || colors.secondary }]}>
            <FontAwesome name="star" size={10} color="#fff" />
          </View>
        )}
        
        <View style={[styles.avatarWrapper, { borderColor: p.color || colors.primary, borderWidth: active ? 2 : 0 }]}>
          <Image source={{ uri: p.avatarUri }} style={styles.avatarImg} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.accent}>{p.accent}</Text>
          {p.description && (
            <Text style={styles.description} numberOfLines={1}>{p.description}</Text>
          )}
        </View>

        {active && (
          <View style={[styles.checkBadge, { backgroundColor: p.color || colors.primary }]}>
            <FontAwesome name="check" size={10} color="#fff" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  card: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardActive: {
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2,
    backgroundColor: '#fff',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  cardInfo: {
    alignItems: 'center',
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  accent: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  description: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
