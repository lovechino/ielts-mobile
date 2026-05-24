import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: 'rgba(194,198,214,0.3)',
          backgroundColor: 'rgba(247,249,251,0.8)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
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
