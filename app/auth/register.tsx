import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  // Animation values
  const logoScale = useSharedValue(1);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);

  useEffect(() => {
    // Logo breathing effect
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      true
    );

    // Floating background shapes
    float1.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 4500 }),
        withTiming(0, { duration: 4500 })
      ),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: 5500 }),
        withTiming(0, { duration: 5500 })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const float1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value }, { translateX: float1.value * 0.4 }],
  }));

  const float2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value }, { translateX: float2.value * -0.5 }],
  }));

  const handleRegister = async () => {
    if (!fullName || !email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      {/* Background Decorations */}
      <Animated.View style={[styles.bgCircle, { top: -40, left: -60, backgroundColor: colors.primary + '10' }, float1Style]} />
      <Animated.View style={[styles.bgCircle, { bottom: 50, right: -100, width: 250, height: 250, backgroundColor: colors.secondary + '15' }, float2Style]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.brandSection}>
            <Animated.View style={[styles.brandIcon, logoAnimatedStyle]}>
              <FontAwesome name="graduation-cap" size={28} color={colors.secondary} />
            </Animated.View>
            <Text style={styles.brandName}>Talko</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.headerText}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSub}>Start your IELTS journey today</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <FontAwesome name="user" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.outline}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>
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
                  placeholder="Password (6+ characters)"
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
            <TouchableOpacity style={styles.signUpBtn} onPress={handleRegister} disabled={loading}>
              <Text style={styles.signUpBtnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(1000)} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  bgCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
  },
  brandSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  brandIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(194,198,214,0.3)',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
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
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20,
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
  signUpBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing.lg,
    borderRadius: radius.full, alignItems: 'center',
    elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 8,
  },
  signUpBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  footer: { flexDirection: 'row', marginTop: spacing.xl },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});
