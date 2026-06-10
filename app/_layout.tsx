import { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { FontAwesome } from '@expo/vector-icons';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ToastContainer } from '@/components/ui/Toast';
import { LowBalanceModal } from '@/components/ui/LowBalanceModal';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { useVaultSyncStore } from '@/stores/useVaultSyncStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getSecureItem, deleteSecureItem } from '@/lib/storage';
import { DICT_INITIAL_URL, DICT_INITIAL_VERSION } from '@/constants/config';
import { colors } from '@/theme/tokens';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withSequence, 
  withDelay,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Polyfill for findLast and findLastIndex (Required for some older Hermes engines)
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function(predicate: any, thisArg?: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) return this[i];
    }
    return undefined;
  };
}
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function(predicate: any, thisArg?: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) return i;
    }
    return -1;
  };
}

// Ẩn splash native càng sớm càng tốt
SplashScreen.hideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  // Animation Values
  const catX = useSharedValue(-100);
  const catY = useSharedValue(height / 2 + 100);
  const catRotate = useSharedValue(-45);
  const brandScale = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const splashOpacity = useSharedValue(1);

  const startDownload = useDownloadStore(s => s.startDownload);
  const checkUpdate = useDownloadStore(s => s.checkUpdate);
  const pushSync = useVaultSyncStore(s => s.pushSync);
  const authState = useAuthStore(s => s.authState);

  // 1. Chạy Animation ngay khi component mount
  useEffect(() => {
    // Chữ Talko hiện ra
    brandOpacity.value = withTiming(1, { duration: 800 });
    brandScale.value = withSpring(1);

    // Mèo bay vào
    catX.value = withDelay(400, withSpring(width / 2 - 20, { damping: 12 }));
    catY.value = withDelay(400, withSpring(height / 2 - 60, { damping: 12 }));
    catRotate.value = withDelay(400, withSpring(0));

    // Hiệu ứng nảy và ẩn splash sau 2.2s
    setTimeout(() => {
      brandScale.value = withSequence(withTiming(1.2, { duration: 150 }), withSpring(1));
    }, 1400);

    setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 800 }, (finished) => {
        if (finished) runOnJS(setShowAnimatedSplash)(false);
      });
    }, 2200);
  }, []);

  // 2. Load tài nguyên trong background
  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({ ...FontAwesome.font });
        const dbVersion = await getSecureItem('db_version');
        if (!dbVersion) {
          await startDownload(DICT_INITIAL_URL, DICT_INITIAL_VERSION);
        } else {
          try {
            const { initDictionaryDB } = await import('@/lib/offline/dictionary');
            await initDictionaryDB();
            checkUpdate();
          } catch {
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

  useEffect(() => {
    if (authState === 'authenticated') pushSync();
  }, [authState]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
    transform: [{ scale: interpolate(splashOpacity.value, [0, 1], [1.1, 1]) }]
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ scale: brandScale.value }]
  }));

  const catStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: catX.value },
      { translateY: catY.value },
      { rotate: `${catRotate.value}deg` }
    ]
  }));

  return (
    <View style={{ flex: 1 }}>
      {/* Nội dung chính chỉ hiện khi load xong, nhưng được che bởi Overlay */}
      {appIsReady && (
        <AuthGuard>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="history/[progress_id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="shop/index" options={{ title: 'Cửa hàng', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="shop/inventory" options={{ title: 'Kho đồ', animation: 'slide_from_right' }} />
          </Stack>
          <ToastContainer />
          <LowBalanceModal />
        </AuthGuard>
      )}

      {/* Overlay Animation Splash luôn hiện ngay từ đầu */}
      {showAnimatedSplash && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splashOverlay, splashStyle]} pointerEvents="none">
          <View style={styles.centerContainer}>
             <Animated.View style={brandStyle}>
                <Text style={styles.splashBrand}>Talko</Text>
             </Animated.View>
             <Animated.View style={[styles.catContainer, catStyle]}>
                <FontAwesome name="paw" size={40} color={colors.secondary} />
             </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  splashBrand: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -1,
  },
  catContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  }
});
