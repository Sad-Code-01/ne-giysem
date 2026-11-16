import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius } from '@/theme/spacing';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  cornerRadius?: number;
  padding?: number;
}

/** Eski cam kartın opak karşılığı. Blur yok. */
export function GlassCard({
  children,
  style,
  contentStyle,
  cornerRadius = radius.card,
  padding = 20,
}: GlassCardProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        {
          borderRadius: cornerRadius,
          borderColor: theme.line,
          backgroundColor: theme.surface,
          borderWidth: BORDER_WIDTH,
        },
        style,
      ]}
    >
      <View style={[{ padding }, contentStyle]}>{children}</View>
    </View>
  );
}
