import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  borderLeft?: string;
  borderColor?: string;
  padded?: boolean;
};

export function GlassCard({ children, style, borderLeft, borderColor, padded = true }: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: borderColor || 'rgba(194,198,214,0.3)',
          ...(borderLeft ? { borderLeftWidth: 4, borderLeftColor: borderLeft } : {}),
        },
        padded && { padding: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}
