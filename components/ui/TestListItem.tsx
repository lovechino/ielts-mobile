import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

type TestListItemProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconBgColor: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export function TestListItem({ icon, iconBgColor, iconColor, title, subtitle, onPress }: TestListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
        <FontAwesome name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <FontAwesome name="chevron-right" size={16} color={colors.outline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(194,198,214,0.2)',
  },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, marginLeft: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.outline, marginTop: 2 },
});
