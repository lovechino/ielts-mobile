import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="course/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="lesson/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vocabulary/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="speaking/session" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="speaking/select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="speaking/report" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
