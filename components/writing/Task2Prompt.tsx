import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface Task2PromptProps {
  instruction: string;
  essayType: string;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; structure: string[] }> = {
  OPINION: {
    label: 'Opinion Essay', color: colors.primary, bg: colors.primaryFixed,
    structure: ['Intro: State your view', 'Body 1: Main reason + example', 'Body 2: Second reason + example', 'Conclusion: Restate position'],
  },
  DISCUSSION: {
    label: 'Discussion Essay', color: colors.tertiary, bg: colors.tertiaryFixed,
    structure: ['Intro: Paraphrase + outline', 'Body 1: Side A', 'Body 2: Side B + your view', 'Conclusion: Balanced summary'],
  },
  PROBLEM_SOLUTION: {
    label: 'Problem / Solution', color: colors.secondary, bg: colors.secondaryFixedDim,
    structure: ['Intro: State problem', 'Body 1: Causes/Details', 'Body 2: Solutions', 'Conclusion: Summarize'],
  },
  DIRECT_QUESTION: {
    label: 'Direct Questions', color: '#7c3aed', bg: '#ede9fe',
    structure: ['Intro: Address the topic', 'Body 1: Answer Q1', 'Body 2: Answer Q2', 'Conclusion: Final thought'],
  },
  TWO_PART: {
    label: 'Two-Part Question', color: '#0891b2', bg: '#cffafe',
    structure: ['Intro: Introduce both parts', 'Body 1: Answer first question', 'Body 2: Answer second question', 'Conclusion: Summarize'],
  },
};

export function Task2Prompt({ instruction, essayType }: Task2PromptProps) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = TYPE_META[essayType] || TYPE_META.DISCUSSION;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <FontAwesome name="pencil-square-o" size={14} color={meta.color} style={{ marginRight: 6 }} />
          <Text style={[styles.tag, { color: meta.color }]}>WRITING TASK 2</Text>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <FontAwesome name={collapsed ? 'chevron-down' : 'chevron-up'} size={14} color={colors.outline} />
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.body}>
          <Text style={styles.instruction}>{instruction}</Text>

          <View style={[styles.structureCard, { backgroundColor: meta.bg }]}>
            <Text style={[styles.structureTitle, { color: meta.color }]}>Suggested Structure</Text>
            {meta.structure.map((s, i) => (
              <View key={i} style={styles.structureRow}>
                <View style={[styles.structureDot, { backgroundColor: meta.color }]} />
                <Text style={styles.structureText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.primary, ...shadow.card },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginRight: spacing.sm },
  typeBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  typeText: { fontSize: 10, fontWeight: '700' },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  instruction: { fontSize: 14, color: colors.text, lineHeight: 22, fontWeight: '500' },
  structureCard: { borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  structureTitle: { fontSize: 12, fontWeight: '700', marginBottom: spacing.xs },
  structureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  structureDot: { width: 6, height: 6, borderRadius: 3 },
  structureText: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
