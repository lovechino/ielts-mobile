import { useMemo } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { InlineInput } from '../atoms/InlineInput';

interface DiagramCompletionGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

interface Marker {
  id: string;
  x: number;
  y: number;
}

function parseConfig(group: QuestionGroupDTO): { imageUrl?: string; markers: Marker[] } {
  const cfg = group.config || {};
  const c = cfg as any;
  return {
    imageUrl: c.image_url,
    markers: c.markers || [],
  };
}

export function DiagramCompletionGroup({ group, questions, answers, onAnswer }: DiagramCompletionGroupProps) {
  const { width: screenW } = useWindowDimensions();
  const { imageUrl, markers } = useMemo(() => parseConfig(group), [group.config]);
  const maxContainerW = screenW - spacing.lg * 2 - spacing.md * 2;

  const questionMap = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => {
    const markerId = (q).marker_id;
    if (markerId) map[markerId] = q.id;
    });
    return map;
  }, [questions]);

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Diagram Completion'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      {imageUrl && (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { maxWidth: maxContainerW }]}
            resizeMode="contain"
          />
          {markers.map((m, idx) => {
            const qId = questionMap[m.id];
            const value = qId ? answers[qId] || '' : '';
            return (
              <View
                key={m.id}
                style={[
                  styles.marker,
                  { left: `${m.x * 100}%`, top: `${m.y * 100}%` },
                  value ? styles.markerAnswered : null,
                ]}
              >
                <Text style={[styles.markerId, value && styles.markerIdAnswered]}>{m.id}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.questions}>
        {questions.map((q, idx) => {
          const markerId = q.marker_id || '';
          return (
            <View key={q.id} style={styles.qRow}>
              <Text style={styles.qNum}>{idx + 1}.</Text>
              {markerId ? <Text style={styles.markerLabel}>({markerId})</Text> : null}
              <Text style={styles.qText}>{q.content}</Text>
              <InlineInput value={answers[q.id] || ''} onChangeText={(t) => onAnswer(q.id, t)} />
            </View>
          );
        })}
      </View>

      {!imageUrl && (
        <Text style={styles.noImage}>Diagram image not available.</Text>
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
  imageWrap: { position: 'relative', marginBottom: spacing.md, alignItems: 'center' },
  image: { width: '100%', height: 300, borderRadius: radius.md },
  marker: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    borderWidth: 2, borderColor: '#fff',
  },
  markerAnswered: { backgroundColor: colors.tertiary },
  markerId: { fontSize: 12, fontWeight: '800', color: '#fff' },
  markerIdAnswered: { color: '#fff' },
  questions: { gap: spacing.md },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  markerLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, width: 24 },
  qText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  noImage: { fontStyle: 'italic', color: colors.textMuted, fontSize: 14, textAlign: 'center', padding: spacing.md },
});
