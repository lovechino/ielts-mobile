import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

const isMobile = Platform.OS !== 'web';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarShowLabel: !isMobile,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: 'rgba(194,198,214,0.3)',
          backgroundColor: 'rgba(247,249,251,0.8)',
          height: isMobile ? 64 : 64,
          paddingTop: isMobile ? 4 : 8,
          paddingBottom: isMobile ? 4 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="material/index"
        options={{
          title: 'Tài liệu',
          tabBarLabel: 'Tài liệu',
          tabBarIcon: ({ color, size }) => <FontAwesome name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="test/index"
        options={{
          title: 'Kiểm tra',
          tabBarLabel: 'Kiểm tra',
          tabBarIcon: ({ color, size }) => <FontAwesome name="pencil-square" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Hồ sơ',
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
