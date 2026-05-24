import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <View style={styles.brandIcon}>
              <FontAwesome name="graduation-cap" size={28} color={colors.secondary} />
            </View>
            <Text style={styles.brandName}>IELTS Master</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSub}>Sign in to continue learning</Text>
          </View>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <FontAwesome name="envelope" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <FontAwesome name="lock" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="Password"
                  placeholderTextColor={colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.visibilityBtn} onPress={() => setShowPassword(!showPassword)}>
                  <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={18} color={colors.outline} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} disabled={loading}>
              <Text style={styles.signInBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialBtns}>
              <TouchableOpacity style={styles.socialBtn}>
                <FontAwesome name="google" size={18} color={colors.primary} />
                <Text style={styles.socialBtnText}>Sign in with Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <FontAwesome name="facebook" size={18} color={colors.primary} />
                <Text style={styles.socialBtnText}>Sign in with Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  brandSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  brandIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(194,198,214,0.3)',
  },
  brandName: { fontSize: 24, fontWeight: '600', color: colors.primary },
  headerText: { alignItems: 'center', marginBottom: spacing.xl },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  welcomeSub: { fontSize: 14, color: colors.textSecondary },
  formCard: {
    width: '100%', maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.xl,
    padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    gap: spacing.lg,
  },
  inputGroup: { gap: spacing.xs },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: spacing.md, top: 16, zIndex: 1 },
  input: {
    width: '100%', paddingLeft: 44, paddingRight: spacing.md, paddingVertical: spacing.md,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, fontSize: 16, color: colors.text,
  },
  visibilityBtn: { position: 'absolute', right: spacing.md, top: 14 },
  signInBtn: {
    backgroundColor: colors.secondaryContainer, paddingVertical: spacing.lg,
    borderRadius: radius.full, alignItems: 'center',
  },
  signInBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(194,198,214,0.5)' },
  dividerText: { fontSize: 14, color: colors.outline, textTransform: 'uppercase', letterSpacing: 1 },
  socialBtns: { gap: spacing.md },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(194,198,214,0.6)',
    borderRadius: radius.md, paddingVertical: spacing.md,
  },
  socialBtnText: { fontSize: 16, color: colors.textSecondary },
  footer: { flexDirection: 'row', marginTop: spacing.xl },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});
