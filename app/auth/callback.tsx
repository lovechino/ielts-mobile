import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setSecureItem, STORAGE_KEYS } from '@/lib/storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors, spacing } from '@/theme/tokens';

export default function AuthCallback() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (token) {
      // Lưu token từ URL (backend trả về sau khi redirect từ Google)
      setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, token).then(() => {
        // Hydrate để lấy thông tin user từ backend bằng token mới
        hydrate().then(() => {
          router.replace('/(tabs)');
        });
      });
    } else {
      router.replace('/auth/login');
    }
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
