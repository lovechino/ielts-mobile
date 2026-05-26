import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Bắt buộc trên Web: Lắng nghe và đóng popup Google Sign-In nếu nó bị redirect về trang chủ
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('disconnected port')) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', handler, true);
    return () => window.removeEventListener('error', handler, true);
  }, []);

  return (
    <AuthGuard>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="course/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="lesson/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vocabulary/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vocabulary/words" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="speaking/session" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="speaking/select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="speaking/report" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AuthGuard>
  );
}
