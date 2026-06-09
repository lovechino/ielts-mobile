import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout 
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useUIStore, ToastType } from '@/stores/useUIStore';

const { width } = Dimensions.get('window');

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(400)}
          exiting={FadeOutUp.duration(300)}
          layout={Layout.springify()}
          style={[styles.toast, styles[toast.type]]}
        >
          <FontAwesome 
            name={getIcon(toast.type)} 
            size={16} 
            color="#fff" 
            style={styles.icon} 
          />
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

function getIcon(type: ToastType): any {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    case 'info': return 'info-circle';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.9,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  icon: { marginRight: spacing.sm },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  success: { backgroundColor: '#00B894' },
  error: { backgroundColor: '#FF7675' },
  warning: { backgroundColor: '#FDCB6E' },
  info: { backgroundColor: colors.primary },
});
