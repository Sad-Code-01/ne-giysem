import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';

interface TagCardProps {
  children: ReactNode;
}

/**
 * İmza etiket kartı: düz kenar, üstte delik halkası.
 * Görsel dosya yok; şekil kodla çizilir.
 */
export function TagCard({ children }: TagCardProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.holeRow}>
        <View style={[styles.hole, { borderColor: theme.line, backgroundColor: theme.bg }]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: BORDER_WIDTH,
    borderRadius: radius.card,
    borderTopRightRadius: radius.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  holeRow: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  hole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: BORDER_WIDTH,
  },
});
