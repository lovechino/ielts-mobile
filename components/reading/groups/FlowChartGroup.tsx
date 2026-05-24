import { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Marker, Path, Rect as SvgRect, Text as SvgText } from 'react-native-svg';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { InlineInput } from '../atoms/InlineInput';

interface FlowChartGroupProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  shape: 'rect' | 'diamond' | 'oval';
}

interface FlowArrow {
  from: string;
  to: string;
}

function parseNodes(group: QuestionGroupDTO): { nodes: FlowNode[]; arrows: FlowArrow[] } {
  const cfg = group.config || {};
  return {
    nodes: (cfg as any).nodes || [],
    arrows: (cfg as any).arrows || [],
  };
}

function getQuestionNumber(label: string): number | null {
  const m = label.match(/\{Q(\d+)\}/);
  return m ? parseInt(m[1], 10) : null;
}

const NODE_W = 160;
const NODE_H = 50;
const SVG_W = 400;
const SVG_H = 600;

function ShapeRect({ x, y, w, h, label, isInput, value, onValueChange, qNum }: any) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <>
      <SvgRect x={x} y={y} width={w} height={h} rx={8} fill="#fff" stroke={isInput ? colors.primary : colors.outline} strokeWidth={isInput ? 2 : 1.5} />
      {isInput ? (
        <SvgText x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fill={value ? colors.primary : colors.textMuted} fontWeight="600">
          {value || '___'}
        </SvgText>
      ) : (
        <SvgText x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fill={colors.text} fontWeight="600">
          {label}
        </SvgText>
      )}
      {qNum && (
        <SvgRect x={x + w - 22} y={y - 10} width={22} height={16} rx={4} fill={colors.primary} />
      )}
      {qNum && (
        <SvgText x={x + w - 11} y={y + 2} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="700">
          {qNum}
        </SvgText>
      )}
    </>
  );
}

function ShapeDiamond({ x, y, w, h, label }: any) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const points = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
  return (
    <>
      <SvgRect x={x} y={y} width={w + 30} height={h + 10} rx={0} fill="transparent" stroke="transparent" />
      <SvgText x={cx} y={cy + 5} textAnchor="middle" fontSize={12} fill={colors.text} fontWeight="600">
        {label}
      </SvgText>
    </>
  );
}

export function FlowChartGroup({ group, questions, answers, onAnswer }: FlowChartGroupProps) {
  const { width: screenW } = useWindowDimensions();
  const { nodes, arrows } = useMemo(() => parseNodes(group), [group.config]);
  const svgW = Math.min(SVG_W, screenW - spacing.lg * 2 - spacing.md * 2);

  const questionMap = useMemo(() => {
    const map: Record<number, string> = {};
    questions.forEach((q, idx) => { map[idx + 1] = q.id; });
    return map;
  }, [questions]);

  if (nodes.length === 0) {
    return (
      <View style={styles.groupCard}>
        <Text style={styles.title}>{group.title || 'Flow Chart'}</Text>
        <Text style={styles.instruction}>{group.instruction}</Text>
        <View style={styles.questions}>
          {questions.map((q, idx) => (
            <View key={q.id} style={styles.qRow}>
              <Text style={styles.qNum}>{idx + 1}.</Text>
              <Text style={styles.qText}>{q.content}</Text>
              <InlineInput value={answers[q.id] || ''} onChangeText={(t) => onAnswer(q.id, t)} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.groupCard}>
      <Text style={styles.title}>{group.title || 'Flow Chart'}</Text>
      {group.instruction ? <Text style={styles.instruction}>{group.instruction}</Text> : null}

      <View style={styles.svgWrap}>
        <Svg width={svgW} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <Defs>
            <Marker id="arrowhead" viewBox="0 0 10 7" refX={10} refY={3.5} markerWidth={10} markerHeight={7} orient="auto">
              <Path d="M 0 0 L 10 3.5 L 0 7 Z" fill={colors.outline} />
            </Marker>
          </Defs>

          {arrows.map((arr, i) => {
            const from = nodes.find((n) => n.id === arr.from);
            const to = nodes.find((n) => n.id === arr.to);
            if (!from || !to) return null;
            const x1 = (from.x / 100) * SVG_W;
            const y1 = (from.y / 100) * SVG_H + NODE_H;
            const x2 = (to.x / 100) * SVG_W + NODE_W / 2;
            const y2 = (to.y / 100) * SVG_H;
            return (
              <Path
                key={i}
                d={`M ${x1 + NODE_W / 2} ${y1} L ${x2} ${y2}`}
                stroke={colors.outline}
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {nodes.map((node) => {
            const qNum = getQuestionNumber(node.label);
            const isInput = qNum !== null;
            const qId = qNum ? questionMap[qNum] : null;
            const value = qId ? (answers[qId] || '') : '';
            const x = (node.x / 100) * SVG_W;
            const y = (node.y / 100) * SVG_H;

            if (node.shape === 'diamond') {
              return <ShapeDiamond key={node.id} x={x} y={y} w={NODE_W} h={NODE_H} label={node.label.replace(/\{Q\d+\}/g, '___')} />;
            }
            return (
              <ShapeRect
                key={node.id}
                x={x}
                y={y}
                w={NODE_W}
                h={NODE_H}
                label={node.label}
                isInput={isInput}
                value={value}
                qNum={qNum}
                onValueChange={(v: string) => qId && onAnswer(qId, v)}
              />
            );
          })}
        </Svg>
      </View>

      {questions.length > 0 && (
        <View style={styles.questions}>
          {questions.map((q, idx) => (
            <View key={q.id} style={styles.qRow}>
              <Text style={styles.qNum}>{idx + 1}.</Text>
              <Text style={styles.qText}>{q.content}</Text>
              <InlineInput value={answers[q.id] || ''} onChangeText={(t) => onAnswer(q.id, t)} />
            </View>
          ))}
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
  svgWrap: { alignItems: 'center', marginVertical: spacing.sm },
  questions: { gap: spacing.md, marginTop: spacing.sm },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qNum: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
  qText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
