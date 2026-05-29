import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { FontAwesome } from '@expo/vector-icons';

const CRITERIA = [
  { key: 'fluency', label: 'Fluency & Coherence', icon: 'tachometer' },
  { key: 'lexicalResource', label: 'Lexical Resource', icon: 'book' },
  { key: 'grammaticalRange', label: 'Grammar Range & Accuracy', icon: 'pencil' },
  { key: 'pronunciation', label: 'Pronunciation', icon: 'volume-up' },
];

function bandColor(score: number): string {
  if (score >= 8) return colors.primary;
  if (score >= 7) return colors.tertiary;
  if (score >= 6) return colors.secondary;
  if (score >= 5) return colors.secondaryContainer;
  return colors.error;
}

function BandScoreRing({ score }: { score: number }) {
  const color = bandColor(score);
  return (
    <View style={styles.ringOuter}>
      <View style={[styles.ringInner, { borderColor: color }]}>
        <Text style={[styles.ringScore, { color }]}>{score.toFixed(1)}</Text>
        <Text style={styles.ringLabel}>BAND</Text>
      </View>
    </View>
  );
}

function CriterionBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const color = bandColor(score);
  const pct = Math.max(5, (score / 9) * 100);
  return (
    <View style={styles.criterionRow}>
      <View style={styles.criterionHeader}>
        <FontAwesome name={icon as any} size={14} color={colors.textSecondary} style={{ width: 20 }} />
        <Text style={styles.criterionLabel}>{label}</Text>
        <Text style={[styles.criterionScore, { color }]}>{score.toFixed(1)}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ErrorCard({ error, index }: { error: { type: string; example: string; correction: string }; index: number }) {
  const typeColors: Record<string, string> = {
    grammar: colors.error,
    vocabulary: colors.secondary,
    pronunciation: colors.secondaryContainer,
  };
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorHeader}>
        <Text style={styles.errorIndex}>#{index + 1}</Text>
        <View style={[styles.errorTypeBadge, { backgroundColor: typeColors[error.type] || colors.outline }]}>
          <Text style={styles.errorTypeText}>{error.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.errorLabel}>What you said:</Text>
      <Text style={styles.errorExample}>"{error.example}"</Text>
      <Text style={styles.errorLabel}>Correction:</Text>
      <Text style={styles.errorCorrection}>{error.correction}</Text>
    </View>
  );
}

export default function SpeakingReportScreen() {
  const router = useRouter();
  const { report, resetStore } = useSpeakingStore();

  if (!report) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No report data available.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/speaking/select')}>
          <Text style={styles.actionBtnText}>Start Practice</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePracticeAgain = () => {
    resetStore();
    router.replace('/speaking/select');
  };

  const handleGoHome = () => {
    resetStore();
    router.replace('/');
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Speaking Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <BandScoreRing score={report.averageBandEstimate} />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <FontAwesome name="clock-o" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{formatDuration(report.duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <FontAwesome name="exchange" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{report.turnsCompleted}</Text>
          <Text style={styles.statLabel}>Turns</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Score Breakdown</Text>
      <View style={styles.criteriaCard}>
        {CRITERIA.map((c) => (
          <CriterionBar
            key={c.key}
            label={c.label}
            score={(report.breakdown as any)[c.key] ?? report.averageBandEstimate}
            icon={c.icon}
          />
        ))}
      </View>

      {report.topErrors.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Errors & Corrections</Text>
          {report.topErrors.map((err, i) => (
            <ErrorCard key={i} error={err} index={i} />
          ))}
        </>
      )}

      {report.nextSessionSuggestion && (
        <>
          <Text style={styles.sectionTitle}>Chuyên gia nhận xét & Lộ trình</Text>
          <View style={styles.suggestionCard}>
            <FontAwesome name="lightbulb-o" size={18} color={colors.secondary} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.suggestionText}>{report.nextSessionSuggestion}</Text>
          </View>
        </>
      )}

      {/* Hiển thị lỗi ngữ pháp chi tiết từ các turns nếu có */}
      {useSpeakingStore.getState().turns.some(t => t.grammar_errors && t.grammar_errors.length > 0) && (
        <>
          <Text style={styles.sectionTitle}>Phân tích lỗi Ngữ pháp chi tiết</Text>
          {useSpeakingStore.getState().turns.flatMap((t, turnIdx) => 
            (t.grammar_errors || []).map((err, errIdx) => (
              <View key={`turn-${turnIdx}-err-${errIdx}`} style={styles.errorCard}>
                <View style={styles.errorHeader}>
                  <Text style={styles.errorIndex}>Turn {turnIdx + 1}</Text>
                  <View style={[styles.errorTypeBadge, { backgroundColor: colors.error }]}>
                    <Text style={styles.errorTypeText}>GRAMMAR</Text>
                  </View>
                </View>
                <Text style={styles.errorLabel}>Lỗi của bạn:</Text>
                <Text style={styles.errorExample}>"{err.original}"</Text>
                <Text style={styles.errorLabel}>Sửa lại:</Text>
                <Text style={styles.errorCorrection}>{err.corrected}</Text>
                <Text style={[styles.errorLabel, { marginTop: 4 }]}>Giải thích:</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>{err.explanation_vi}</Text>
              </View>
            ))
          )}
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePracticeAgain}>
          <FontAwesome name="repeat" size={16} color="#fff" style={{ marginRight: spacing.sm }} />
          <Text style={styles.primaryBtnText}>Practice Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
          <FontAwesome name="home" size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.lg },
  actionBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },

  ringOuter: { alignItems: 'center', marginVertical: spacing.md },
  ringInner: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', ...shadow.card,
  },
  ringScore: { fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  ringLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1 },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', gap: spacing.xs, ...shadow.card,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },

  criteriaCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, ...shadow.card },
  criterionRow: { gap: spacing.xs },
  criterionHeader: { flexDirection: 'row', alignItems: 'center' },
  criterionLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, marginLeft: spacing.xs },
  criterionScore: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  barTrack: { height: 8, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },

  errorCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  errorHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  errorIndex: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  errorTypeBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  errorTypeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  errorLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  errorExample: { fontSize: 14, color: colors.text, fontStyle: 'italic', marginBottom: spacing.sm },
  errorCorrection: { fontSize: 14, color: colors.primary, fontWeight: '600' },

  suggestionCard: {
    backgroundColor: colors.secondaryFixed, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, borderLeftColor: colors.secondary, ...shadow.card,
  },
  suggestionText: { fontSize: 14, color: colors.onSecondaryFixedVariant, lineHeight: 20 },

  actions: { gap: spacing.md, marginTop: spacing.lg },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md,
    ...shadow.button,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.primary,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
});
