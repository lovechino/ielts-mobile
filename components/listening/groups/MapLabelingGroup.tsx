import { useMemo } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { MapMarkerPin } from '../atoms/MapMarkerPin';

interface MapLabelingGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
}

interface MarkerConfig {
  id: string;
  x: number;
  y: number;
}

function parseConfig(group: QuestionGroupDTO): { imageUrl?: string; markers: MarkerConfig[] } {
  const cfg = group.config || {};
  const c = cfg as any;
  return {
    imageUrl: c.image_url,
    markers: c.markers || [],
  };
}

function parseOptions(group: QuestionGroupDTO): Array<{ id: string; text: string }> {
  if (group.options_pool && Array.isArray(group.options_pool)) {
    return group.options_pool.map((o: any) => ({
      id: o.id || String(o),
      text: o.text || String(o),
    }));
  }
  return [];
}

export function MapLabelingGroup({ group, questions, answers, onAnswer, activeQuestionNumber }: MapLabelingGroupProps) {
  const { width: screenW } = useWindowDimensions();
  const { imageUrl, markers } = useMemo(() => parseConfig(group), [group.config]);
  const options = useMemo(() => parseOptions(group), [group.options_pool]);
  const maxW = screenW - spacing.lg * 2 - spacing.md * 2;

  const questionMap = useMemo(() => {
    const map: Record<string, { qId: string; qNum: number }> = {};
    questions.forEach((q, idx) => {
      const mid = q.marker_id;
      if (mid) map[mid] = { qId: q.id, qNum: idx + 1 };
    });
    return map;
  }, [questions]);

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Map Labeling'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      {imageUrl && (
        <View style={[styles.mapWrap, { maxWidth: maxW }]}>
          <Image source={{ uri: imageUrl }} style={styles.mapImage} resizeMode="contain" />
          {markers.map((m) => {
            const info = questionMap[m.id];
            const value = info ? answers[info.qId] || '' : '';
            return (
              <MapMarkerPin
                key={m.id}
                markerId={m.id}
                x={m.x}
                y={m.y}
                isAnswered={!!value}
                selectedValue={value}
                options={options}
                onSelect={(val) => info && onAnswer(info.qId, val)}
                isActive={info ? activeQuestionNumber === info.qNum : false}
              />
            );
          })}
        </View>
      )}

      <View style={styles.summary}>
        {questions.map((q, idx) => {
          const val = answers[q.id] || '?';
          const opt = options.find((o) => o.id === val);
          return (
            <Text key={q.id} style={styles.summaryText}>
              {q.marker_id}→[{opt ? opt.text : val}]
            </Text>
          );
        })}
      </View>

      {!imageUrl && options.length > 0 && (
        <View style={styles.fallbackOptions}>
          {questions.map((q, idx) => {
            const val = answers[q.id] || '';
            return (
              <View key={q.id} style={styles.fallbackRow}>
                <Text style={styles.fallbackLabel}>{q.marker_id || idx + 1}.</Text>
                <View style={styles.optRow}>
                  {options.map((o) => (
                    <Text
                      key={o.id}
                      style={[styles.optChip, val === o.id && styles.optChipActive]}
                      onPress={() => onAnswer(q.id, o.id)}
                    >
                      {o.id}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadow.card,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  instruction: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  mapWrap: { position: 'relative', marginBottom: spacing.sm, alignSelf: 'center', width: '100%' },
  mapImage: { width: '100%', height: 280, borderRadius: radius.md },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  summaryText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  fallbackOptions: { gap: spacing.sm },
  fallbackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fallbackLabel: { fontSize: 13, fontWeight: '700', color: colors.text, width: 24 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  optChip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.unit,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    overflow: 'hidden',
  },
  optChipActive: { backgroundColor: colors.primary, borderColor: colors.primary, color: '#fff' },
});
