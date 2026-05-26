import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { startSession } from '@/lib/api/speaking';
import { FontAwesome } from '@expo/vector-icons';

const MODES = [
  { key: 'part1', label: 'Part 1: Introduction', desc: 'Everyday topics (4-5 min)', icon: 'comments' },
  { key: 'part2', label: 'Part 2: Long Turn', desc: 'Speak on a topic (3-4 min)', icon: 'microphone' },
  { key: 'part3', label: 'Part 3: Discussion', desc: 'Abstract topics (4-5 min)', icon: 'commenting' },
  { key: 'full', label: 'Full Mock Test', desc: 'Complete 11-14 min test', icon: 'graduation-cap', popular: true },
];

const PERSONAS = [
  { id: 'james', name: 'James British', subtitle: 'Professional Examiner' },
  { id: 'emily', name: 'Emily Australian', subtitle: 'IELTS Coach' },
  { id: 'dr_chen', name: 'Dr. Chen American', subtitle: 'Academic Professor' },
  { id: 'sarah', name: 'Sarah American', subtitle: 'Senior Examiner' },
];

export default function SpeakingSelectScreen() {
  const router = useRouter();
  const { topic, lessonId } = useLocalSearchParams<{ topic?: string; lessonId?: string }>();
  const { setSessionId, setCurrentPersonaId, setPrefill, setAppState } = useSpeakingStore();
  const { user } = useAuthStore();
  const [selectedMode, setSelectedMode] = useState('part1');
  const [selectedPersona, setSelectedPersona] = useState(user?.ai_persona || 'james');

  const getPart = () => selectedMode === 'part1' ? 1 : selectedMode === 'part2' ? 2 : selectedMode === 'part3' ? 3 : 1;

  const handleStart = async () => {
    if (!selectedMode) return;
    const part = getPart();
    setCurrentPersonaId(selectedPersona);
    if (topic) {
      setPrefill(topic, part);
    }
    try {
      const session = await startSession({ personaId: selectedPersona, topic: topic || 'Free Practice', part });
      setSessionId(session.sessionId);
      setPrefill(topic || 'Free Practice', part);
      setAppState('speaking');
      router.push('/speaking/session');
    } catch (err: any) {
      Alert.alert('Error', 'Could not start session.');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Speaking Practice</Text>
        <Text style={styles.subtitle}>Choose your mode and examiner</Text>
        <Text style={styles.sectionLabel}>Mode</Text>
        {MODES.map((m) => (
          <TouchableOpacity key={m.key} style={[styles.modeCard, selectedMode === m.key && styles.modeCardActive]} onPress={() => setSelectedMode(m.key)}>
            <View style={styles.modeCardLeft}>
              <FontAwesome name={m.icon as any} size={20} color={selectedMode === m.key ? '#fff' : colors.primary} style={{ width: 28 }} />
              <View>
                <Text style={[styles.modeLabel, selectedMode === m.key && styles.textWhite]}>{m.label}</Text>
                <Text style={[styles.modeDesc, selectedMode === m.key && styles.textWhiteOpaque]}>{m.desc}</Text>
              </View>
            </View>
            {m.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAR</Text></View>}
          </TouchableOpacity>
        ))}
        <Text style={styles.sectionLabel}>Examiner</Text>
        <View style={styles.personaRow}>
          {PERSONAS.map((p) => (
            <TouchableOpacity key={p.id} style={[styles.personaChip, selectedPersona === p.id && styles.personaChipActive]} onPress={() => setSelectedPersona(p.id)}>
              <Text style={[styles.personaName, selectedPersona === p.id && styles.textWhite]}>{p.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>Start Practice</Text>
          <FontAwesome name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backText: { fontSize: 15, color: colors.text, marginLeft: spacing.xs },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.md },
  modeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  modeCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modeLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  modeDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  textWhite: { color: '#fff' },
  textWhiteOpaque: { color: 'rgba(255,255,255,0.8)' },
  popularBadge: { backgroundColor: '#fd761a', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  popularText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  personaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  personaChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: '#f4f5f7', borderWidth: 1, borderColor: 'transparent' },
  personaChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  personaName: { fontSize: 13, fontWeight: '600', color: colors.text },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#00855b', borderRadius: radius.lg, padding: spacing.md, marginTop: 'auto' },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
