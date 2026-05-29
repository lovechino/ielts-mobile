import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerPushToken, unregisterPushToken } from '@/lib/api/notifications';

interface NotificationState {
  expoPushToken: string | null;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  /** Đăng ký push token sau khi user đăng nhập */
  register: () => Promise<void>;
  /** Xóa push token khi user đăng xuất */
  unregister: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  expoPushToken: null,
  permissionStatus: 'undetermined',

  register: async () => {
    // Push notifications chỉ hoạt động trên thiết bị thật
    if (!Device.isDevice) return;

    try {
      // Xin quyền
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      set({ permissionStatus: finalStatus as 'granted' | 'denied' | 'undetermined' });

      if (finalStatus !== 'granted') return;

      // Lấy Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;

      set({ expoPushToken: token });

      // Gửi lên backend
      await registerPushToken({
        expo_push_token: token,
        platform: Platform.OS,
      });

      // Cấu hình notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch {
      // Không throw — push notification là optional feature
    }
  },

  unregister: async () => {
    const { expoPushToken } = get();
    if (!expoPushToken) return;

    try {
      await unregisterPushToken(expoPushToken);
    } catch {
      // Ignore — token sẽ tự expire
    } finally {
      set({ expoPushToken: null });
    }
  },
}));
