import { useEffect, useState, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { handleDeepLink } from '@/lib/deeplink';
import { DictionaryDownloadModal } from '@/components/shared/DictionaryDownloadModal';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { useVaultSyncStore } from '@/stores/useVaultSyncStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getSecureItem, deleteSecureItem, STORAGE_KEYS } from '@/lib/storage';
import { DICT_INITIAL_URL, DICT_INITIAL_VERSION } from '@/constants/config';

// Polyfill for findLast and findLastIndex (Required for some older Hermes engines)
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function (predicate: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate(this[i], i, this)) return this[i];
    }
    return undefined;
  };
}
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function (predicate: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate(this[i], i, this)) return i;
    }
    return -1;
  };
}

// Giữ màn hình Splash cho đến khi chúng ta tải xong tài nguyên
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();
  const startDownload = useDownloadStore(s => s.startDownload);
  const checkUpdate = useDownloadStore(s => s.checkUpdate);
  const autoSync = useVaultSyncStore(s => s.autoSync);
  const authState = useAuthStore(s => s.authState);

  // Vault auto-sync khi user đăng nhập thành công (premium only — store handles tier check)
  useEffect(() => {
    if (authState === 'authenticated') {
      autoSync();
    }
  }, [authState]);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Tải trước các Font và Icons
        await Font.loadAsync({
          ...FontAwesome.font,
        });

        // 2. Kiểm tra dữ liệu từ điển (Cơ chế TFlat)
        const dbVersion = await getSecureItem('db_version');
        if (!dbVersion) {
          // Lần đầu cài app — tải full DB từ GitHub repo vocabulary
          await startDownload(DICT_INITIAL_URL, DICT_INITIAL_VERSION);
        } else {
          // Đã có DB — pre-validate trước khi check update
          // Nếu file corrupt, initDictionaryDB sẽ tự xóa và reset db_version
          try {
            const { initDictionaryDB } = await import('@/lib/offline/dictionary');
            await initDictionaryDB();
            // DB OK → check update trong background
            checkUpdate();
          } catch {
            // Corrupt không recover được → xóa version và tải lại
            await deleteSecureItem('db_version');
            await startDownload(DICT_INITIAL_URL, DICT_INITIAL_VERSION);
          }
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Ẩn màn hình Splash khi mọi thứ đã sẵn sàng
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

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

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
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
    </View>
  );
}
