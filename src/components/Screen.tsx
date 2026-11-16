import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

interface ScreenProps {
  children: ReactNode;
}

/** Düz zemin. Gradyan ve blur yok. */
export function Screen({ children }: ScreenProps) {
  const theme = useAppTheme();
  return <View style={[styles.fill, { backgroundColor: theme.bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
