import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface Task1AcademicPromptProps {
  visualType: string;
  imageUrl?: string | null;
  instruction: string;
}

const VISUAL_LABELS: Record<string, string> = {
  BAR_CHART: 'Bar Chart', LINE_GRAPH: 'Line Graph', PIE_CHART: 'Pie Chart',
  TABLE: 'Table', MAP: 'Map', PROCESS_DIAGRAM: 'Process Diagram',
  TWO_CHARTS: 'Two Charts',
};

export function Task1AcademicPrompt({ visualType, imageUrl, instruction }: Task1AcademicPromptProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [pinned, setPinned] = useState(false);
  const pinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pinned) return;
    pinTimerRef.current = setTimeout(() => {
      setAutoCollapsed(true);
      setCollapsed(true);
    }, 60000);
    return () => { if (pinTimerRef.current) clearTimeout(pinTimerRef.current); };
  }, [pinned]);

  const handleToggle = () => {
    setCollapsed(!collapsed);
    setAutoCollapsed(false);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={handleToggle} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <FontAwesome name="file-image-o" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
          <Text style={styles.tag}>WRITING TASK 1</Text>
          <View style={styles.typeBadge}><Text style={styles.typeText}>{VISUAL_LABELS[visualType] || visualType}</Text></View>
        </View>
        <View style={styles.headerRight}>
          {!pinned && (
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); setPinned(true); }} style={{ padding: 4 }}>
              <FontAwesome name="thumb-tack" size={14} color={pinned ? colors.primary : colors.outline} />
            </TouchableOpacity>
          )}
          {!autoCollapsed && !collapsed ? (
            <Text style={styles.autoHint}>Will collapse in 60s</Text>
          ) : null}
          <FontAwesome name={collapsed ? 'chevron-down' : 'chevron-up'} size={14} color={colors.outline} />
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.body}>
          <Text style={styles.instruction}>{instruction}</Text>
          {imageUrl && (
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.secondary, ...shadow.card },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tag: { fontSize: 11, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5, marginRight: spacing.sm },
  typeBadge: { backgroundColor: colors.secondaryFixedDim, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  typeText: { fontSize: 10, fontWeight: '700', color: colors.onSecondaryFixedVariant },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  autoHint: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  instruction: { fontSize: 14, color: colors.text, lineHeight: 22, fontWeight: '500' },
  imageWrap: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceContainerLow },
  image: { width: '100%', height: 240 },
});
