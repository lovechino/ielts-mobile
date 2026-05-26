import { useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors, spacing } from '@/theme/tokens';

const AUTH_SCREENS = ['auth'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authState, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const hydratedRef = useRef(false);
  const navigatingRef = useRef(false);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      hydrate();
    }
  }, [hydrate]);

  const navigate = useCallback((to: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    const current = `/${segments.filter(Boolean).join('/')}`;
    if (current === to) {
      navigatingRef.current = false;
      return;
    }
    requestAnimationFrame(() => {
      router.replace(to);
      navigatingRef.current = false;
    });
  }, [segments, router]);

  useEffect(() => {
    if (authState === 'loading') return;

    const inAuthScreen = AUTH_SCREENS.includes(segments[0]);
    const isAuthenticated = authState === 'authenticated';

    if (!isAuthenticated && !inAuthScreen) {
      navigate('/auth/login');
    } else if (isAuthenticated && inAuthScreen) {
      navigate('/(tabs)');
    }
  }, [authState, segments, navigate]);

  if (authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Peak</Text>
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
