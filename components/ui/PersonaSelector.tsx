import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

type PersonaItem = {
  id: string;
  name: string;
  avatarUri: string;
  isPremium?: boolean;
};

type PersonaSelectorProps = {
  personas: PersonaItem[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function PersonaSelector({ personas, selectedId, onSelect }: PersonaSelectorProps) {
  return (
    <View style={styles.list}>
      {personas.map((p) => {
        const active = selectedId === p.id;
        return (
          <TouchableOpacity
            key={p.id}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onSelect(p.id)}
            activeOpacity={0.8}
          >
            {p.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
            <View style={styles.itemLeft}>
              <View style={styles.avatar}>
                <Image source={{ uri: p.avatarUri }} style={styles.avatarImg} />
              </View>
              <Text style={styles.name}>{p.name}</Text>
            </View>
            <FontAwesome
              name={active ? 'check-circle' : 'circle-o'}
              size={22}
              color={active ? colors.primary : colors.outline}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  itemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(216,226,255,0.3)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    borderBottomLeftRadius: radius.md,
    zIndex: 1,
  },
  premiumText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surfaceContainerHigh },
  avatarImg: { width: '100%', height: '100%' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
});
