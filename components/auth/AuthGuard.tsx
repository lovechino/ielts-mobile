import { useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors, spacing } from '@/theme/tokens';

const AUTH_SCREENS = ['auth'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authState, hydrate, hasCompletedAssessment } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigatingRef = useRef(false);
  const hydrateCalledRef = useRef(false);

  useEffect(() => {
    // Chỉ gọi hydrate() một lần, và chỉ khi authState vẫn là 'loading'
    // (tức là persist chưa rehydrate được, hoặc chưa có session trước đó)
    if (!hydrateCalledRef.current && authState === 'loading') {
      hydrateCalledRef.current = true;
      hydrate();
    }
  }, [authState, hydrate]);

  const navigate = useCallback((to: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    const current = `/${segments.filter(Boolean).join('/')}`;
    if (current === to) {
      navigatingRef.current = false;
      return;
    }
    requestAnimationFrame(() => {
      router.replace(to as any);
      navigatingRef.current = false;
    });
  }, [segments, router]);

  useEffect(() => {
    if (authState === 'loading') return;

    const inAuthScreen = AUTH_SCREENS.includes(segments[0]);
    const isAuthenticated = authState === 'authenticated';
    const inAssessment = segments.includes('assessment') || segments.includes('recommendations');

    if (!isAuthenticated && !inAuthScreen) {
      navigate('/auth/login');
    } else if (isAuthenticated) {
      if (inAuthScreen) {
        navigate(hasCompletedAssessment ? '/(tabs)' : '/vocabulary/assessment');
      } else if (!hasCompletedAssessment && !inAssessment) {
        navigate('/vocabulary/assessment');
      }
    }
  }, [authState, segments, navigate, hasCompletedAssessment]);

  // Chỉ hiện loading khi thực sự đang check (chưa có cached state)
  if (authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Talko</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
});
