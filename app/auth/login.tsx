import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { API_BASE_URL } from '@/constants/config';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Required: completes the auth session on mobile after returning from Google
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const showToast = useUIStore((s) => s.showToast);

  // Animation values
  const logoScale = useSharedValue(1);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const shakeX = useSharedValue(0);

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
        withTiming(20, { duration: 4000 }),
        withTiming(0, { duration: 4000 })
      ),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 5000 }),
        withTiming(0, { duration: 5000 })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const float1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value }, { translateX: float1.value * 0.5 }],
  }));

  const float2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value }, { translateX: float2.value * -0.3 }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      webClientId: WEB_CLIENT_ID,
      androidClientId: ANDROID_CLIENT_ID,
      usePKCE: true,
      scopes: ['openid', 'profile', 'email'],
    },
    {
      native: `com.googleusercontent.apps.${ANDROID_CLIENT_ID.replace('.apps.googleusercontent.com', '')}:/oauthredirect`,
    }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const code = response.params?.code;
      if (!code) {
        showToast('No authorization code returned.', 'error');
        return;
      }
      handleGoogleCode(code);
    } else if (response?.type === 'error') {
      showToast(response.error?.message || 'An error occurred.', 'error');
    }
  }, [response]);

  const handleGoogleCode = async (code: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(code, request?.redirectUri ?? '');
      router.replace('/(tabs)');
    } catch (err: any) {
      showToast(err?.message || 'Could not authenticate with Google.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGooglePress = () => {
    if (Platform.OS === 'web') {
      window.location.href = `${API_BASE_URL}/auth/google`;
    } else {
      promptAsync();
    }
  };

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleLogin = async () => {
    if (!email || !password) { 
      setErrorMsg('Vui lòng điền đầy đủ thông tin.');
      shake();
      return; 
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      shake();
      setErrorMsg(err?.message || 'Tài khoản hoặc mật khẩu không đúng.');
      showToast('Đăng nhập thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      {/* Background Decorations */}
      <Animated.View style={[styles.bgCircle, { top: -50, right: -50, backgroundColor: colors.secondary + '15' }, float1Style]} />
      <Animated.View style={[styles.bgCircle, { bottom: 100, left: -80, width: 200, height: 200, backgroundColor: colors.primary + '10' }, float2Style]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.brandSection}>
            <Animated.View style={[styles.brandIcon, logoAnimatedStyle]}>
              <FontAwesome name="paw" size={28} color={colors.secondary} />
            </Animated.View>
            <Text style={styles.brandName}>Talko</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.headerText}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSub}>Sign in to continue learning</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={[styles.formCard, shakeStyle]}>
            {errorMsg && (
              <Animated.View entering={FadeInDown} style={styles.errorBanner}>
                <FontAwesome name="exclamation-circle" size={14} color="#FF7675" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </Animated.View>
            )}
            
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <FontAwesome name="envelope" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errorMsg && styles.inputError]}
                  placeholder="Email"
                  placeholderTextColor={colors.outline}
                  value={email}
                  onChangeText={(val) => { setEmail(val); setErrorMsg(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <FontAwesome name="lock" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 48 }, errorMsg && styles.inputError]}
                  placeholder="Password"
                  placeholderTextColor={colors.outline}
                  value={password}
                  onChangeText={(val) => { setPassword(val); setErrorMsg(null); }}
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
              <TouchableOpacity
                style={[styles.socialBtn, googleLoading && styles.socialBtnDisabled]}
                onPress={handleGooglePress}
                disabled={googleLoading || (Platform.OS !== 'web' && !request)}
              >
                <FontAwesome name="google" size={18} color={colors.primary} />
                <Text style={styles.socialBtnText}>
                  {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(1000)} style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Create account</Text>
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
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FFF5F5', padding: spacing.sm, borderRadius: radius.sm,
    borderWidth: 1, borderColor: '#FED7D7',
  },
  errorBannerText: { fontSize: 13, color: '#C53030', fontWeight: '500' },
  inputGroup: { gap: spacing.xs },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: spacing.md, top: 16, zIndex: 1 },
  input: {
    width: '100%', paddingLeft: 44, paddingRight: spacing.md, paddingVertical: spacing.md,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, fontSize: 16, color: colors.text,
  },
  inputError: { borderColor: '#FF7675', backgroundColor: '#FFF5F5' },
  visibilityBtn: { position: 'absolute', right: spacing.md, top: 14 },
  signInBtn: {
    backgroundColor: colors.secondaryContainer, paddingVertical: spacing.lg,
    borderRadius: radius.full, alignItems: 'center',
    elevation: 4, shadowColor: colors.secondary, shadowOpacity: 0.2, shadowRadius: 8,
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
  socialBtnDisabled: { opacity: 0.6 },
  socialBtnText: { fontSize: 16, color: colors.textSecondary },
  footer: { flexDirection: 'row', marginTop: spacing.xl },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});

