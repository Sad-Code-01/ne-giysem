import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';

interface SurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

/** Opak yüzey: 1.5px düz kenar, gölgesiz. */
export function Surface({ children, style, padded = true }: SurfaceProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        { backgroundColor: theme.surface, borderColor: theme.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: BORDER_WIDTH,
    borderRadius: radius.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
