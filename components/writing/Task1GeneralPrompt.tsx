import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';

interface Task1GeneralPromptProps {
  instruction: string;
  bulletPoints: string[];
  toneRequired: 'FORMAL' | 'SEMI_FORMAL' | 'INFORMAL';
}

const TONE_META: Record<string, { color: string; bg: string; greeting: string; closing: string }> = {
  FORMAL: { color: colors.primary, bg: colors.primaryFixed, greeting: 'Dear Sir/Madam', closing: 'Yours faithfully' },
  SEMI_FORMAL: { color: colors.tertiary, bg: colors.tertiaryFixed, greeting: 'Dear Mr./Ms. [Name]', closing: 'Yours sincerely' },
  INFORMAL: { color: colors.secondary, bg: colors.secondaryFixedDim, greeting: 'Hi [Name]', closing: 'Best wishes' },
};

export function Task1GeneralPrompt({ instruction, bulletPoints, toneRequired }: Task1GeneralPromptProps) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = TONE_META[toneRequired] || TONE_META.SEMI_FORMAL;
  const checkedRef = useState<Set<number>>(new Set());

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <FontAwesome name="envelope-o" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
          <Text style={styles.tag}>WRITING TASK 1 (GT)</Text>
        </View>
        <FontAwesome name={collapsed ? 'chevron-down' : 'chevron-up'} size={14} color={colors.outline} />
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.body}>
          <Text style={styles.instruction}>{instruction}</Text>

          <View style={styles.bullets}>
            {bulletPoints.map((bp, i) => {
              const checked = checkedRef[0].has(i);
              return (
                <TouchableOpacity key={i} style={styles.bulletRow} onPress={() => {
                  const next = new Set(checkedRef[0]);
                  checked ? next.delete(i) : next.add(i);
                  checkedRef[1](next);
                }}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <FontAwesome name="check" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.bulletText, checked && { textDecorationLine: 'line-through', color: colors.textMuted }]}>{bp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.toneCard, { backgroundColor: meta.bg }]}>
            <Text style={styles.toneLabel}>TONE: {toneRequired}</Text>
            <Text style={styles.toneHint}>
              {meta.greeting} ... ... {meta.closing}
            </Text>
            <Text style={styles.toneDesc}>
              {toneRequired === 'FORMAL' ? 'Use formal language, avoid contractions.'
                : toneRequired === 'SEMI_FORMAL' ? 'Polite but natural, use first name.'
                : 'Friendly tone, use contractions.'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.secondary, ...shadow.card },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  tag: { fontSize: 11, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5 },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  instruction: { fontSize: 14, color: colors.text, lineHeight: 22 },
  bullets: { gap: spacing.sm },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.tertiary, borderColor: colors.tertiary },
  bulletText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
  toneCard: { borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  toneLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  toneHint: { fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  toneDesc: { fontSize: 12, color: colors.textSecondary },
});
