import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { handleDeepLink } from '@/lib/deeplink';

// Bắt buộc trên Web: Lắng nghe và đóng popup Google Sign-In nếu nó bị redirect về trang chủ
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('disconnected port')) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', handler, true);
    return () => window.removeEventListener('error', handler, true);
  }, []);

  useEffect(() => {
    // Xử lý deep link khi app đang chạy (foreground)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url, router);
    });

    // Xử lý deep link khi app được mở từ trạng thái closed/background
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url, router);
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    // Xử lý tap vào push notification
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      if (!data) return;

      switch (data.type) {
        case 'scoring_complete':
        case 'scoring_failed':
          // Navigate đến tab Lịch sử để user xem kết quả
          router.push('/(tabs)/test');
          break;
        default:
          if (data.lesson_id) {
            router.push(`/lesson/${data.lesson_id}?type=${data.lesson_type || 'writing'}`);
          }
      }
    });

    return () => sub.remove();
  }, [router]);

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
        <Stack.Screen name="history/[progress_id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AuthGuard>
  );
}
