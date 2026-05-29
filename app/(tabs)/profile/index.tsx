import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { PersonaSelector } from '@/components/ui/PersonaSelector';
import { colors, spacing, radius } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';

const PERSONAS = [
  {
    id: 'james',
    name: 'James (British)',
    avatarUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaq08xumLSIqTJIB9UIjAET-iVNDjXij2qKvFoWYegHkFl1sEWVA0Cm7_UM_qh7zgcWzR853TDUGjAT0cBX--abiNIqHg7eEhbkUHb0HEYLehbxcI0iXQsaaECikiRkvhCxNSp1ml_slsesUjx3c2ldlAJ3ONNUDa7MyhxOuqNdma03RAUEvMr3AV9L5ntJKfpFw109Y38YO9KkFy_yFKglrt8Ztddq9xqzRRi6EwDXmcUttyJdlL180pB2V2T37y_6bShI_cml0o',
  },
  {
    id: 'emily',
    name: 'Emily (Australian)',
    avatarUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNYhNNKnIuYDJzNIsUzLh6eAvvYIz_0ukVVFbCnqC8-TftqD2-CGoWjN1b49V-3yY_EZ9ywvIwaO6BERxtIPpWxQu1iBol1rWGK3qbOOlYZMmtWLJQ52XhcA9zrykzt_T2Ofigvbi3eWA-Th8b5Y_jS1Yh-McHtDTQEfM25iel27cvSgdc8twXU3XTAo8vqgGiZ0emjGuRZYHFFJZOtaW5rcc8ieKKj99wCZvyLT6_MsSKX1raQOShMG97zZXDXoSkqWHv4b7PPls',
  },
  {
    id: 'dr_chen',
    name: 'Dr. Chen (American)',
    avatarUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCginfzaN4mhEwYhjnJDmTLW7wUIQRdfepSim1J_hfwpCNEotoeIrZ8PyoNVADkmn5myR4v0S5B7CnddjRpaAYuPwcauki8G46gdz48PPbt9Hrl9Qa1OIYQA5KmrSdC3EVP31LbV0qkz-_EVlzT5EzxmZvNDrBoQDpyQ_30PNhPevm0fTIhKPtIPqXzjRIKiuaPkY2oxDnzzB9B8caCW5EUAmAwfcJrJlEH4vwQdQbik0E1DZPgF_eOPBHkcdkUbmIFhYOSxXomsDw',
    isPremium: true,
  },
  {
    id: 'sarah',
    name: 'Sarah (American)',
    avatarUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUsy23WCURLBFoSepan61QgVQMj3aoICZRWCuA7P5KYFhyP7M6vK-_mOp2bayWHl5s0M-I_hqJZZRgytJqIG0GundrLWv6YuzwarQ73qeIw1wTImiju6i6H10pS3oqBN12SjJc02l_Msyq9t5x-1-dKjJa4vVz4NyE2Pc4X85DeHcXmLgzkYvjDFjJayI5JUDXDOWAE7hfq89HPWihwtMeAJKyU7xd7WSAKQjXYp-fsVR6G9hDT0wSVsqry_PJNyeZ8um1I93p2QI',
    isPremium: true,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuthStore();
  const [selectedPersona, setSelectedPersona] = useState(user?.ai_persona || 'james');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [targetBand, setTargetBand] = useState(user?.target_band ? String(user.target_band) : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        target_band: targetBand ? parseFloat(targetBand) : undefined,
        ai_persona: selectedPersona,
      });
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <Screen>
      <AppHeader title="Talko" avatarLetter={user?.full_name?.charAt(0)?.toUpperCase() || 'U'} onLeaderboard={() => {}} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>Hồ sơ</Text>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <FontAwesome name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>
        <View style={styles.formFields}>
          <Text style={styles.fieldLabel}>Full name</Text>
          <View style={styles.inputWrap}>
            <FontAwesome name="user" size={18} color={colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.outline}
            />
          </View>
          <Text style={styles.fieldLabel}>Target band</Text>
          <View style={styles.inputWrap}>
            <FontAwesome name="star" size={18} color={colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={targetBand}
              onChangeText={setTargetBand}
              placeholder="e.g. 7.0"
              placeholderTextColor={colors.outline}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={styles.personaSection}>
          <View style={styles.personaHeader}>
            <FontAwesome name="magic" size={18} color={colors.secondary} />
            <Text style={styles.personaTitle}>AI Examiner Persona</Text>
          </View>
          <PersonaSelector personas={PERSONAS} selectedId={selectedPersona} onSelect={setSelectedPersona} />
        </View>
        <GlassCard borderLeft={colors.secondary} style={styles.enrolledCard}>
          <View style={styles.enrolledRow}>
            <View style={styles.enrolledIcon}>
              <FontAwesome name="graduation-cap" size={22} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.enrolledTitle}>Enrolled courses</Text>
              <Text style={styles.enrolledSub}>Active learning programs</Text>
            </View>
            <Text style={styles.enrolledCount}>{user?.enrolled_courses?.length || 0}</Text>
          </View>
        </GlassCard>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save changes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  pageHeader: { gap: spacing.xs },
  pageLabel: { fontSize: 12, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.md, position: 'relative' },
  avatarLarge: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  avatarLargeText: { fontSize: 36, fontWeight: '700', color: colors.primary },
  editBtn: {
    position: 'absolute', bottom: 24, right: '36%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  formFields: { gap: spacing.sm },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.sm,
  },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: spacing.md, top: 16, zIndex: 1 },
  input: {
    width: '100%', paddingLeft: 44, paddingRight: spacing.md, paddingVertical: spacing.md,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, fontSize: 16, color: colors.text,
  },
  personaSection: { gap: spacing.sm },
  personaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  personaTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  enrolledCard: { padding: spacing.lg },
  enrolledRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  enrolledIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,219,202,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  enrolledTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  enrolledSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  enrolledCount: { fontSize: 32, fontWeight: '700', color: colors.secondary },
  saveBtn: {
    backgroundColor: colors.secondaryContainer, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center',
  },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  logoutBtn: { alignItems: 'center', paddingVertical: spacing.md },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
});
