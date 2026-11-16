import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

interface ScreenBackgroundProps {
  children: ReactNode;
  kind?: string;
  isDay?: boolean;
}

/** Düz zemin. Hava gradyanı yok. */
export function ScreenBackground({ children }: ScreenBackgroundProps) {
  const theme = useAppTheme();
  return <View style={[styles.fill, { backgroundColor: theme.bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
