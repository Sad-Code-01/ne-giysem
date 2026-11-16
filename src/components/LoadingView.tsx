import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';

/** Yükleme: etiket kartı iskeleti. Sahte veri yok. */
export function LoadingView() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.hole, { borderColor: theme.line, backgroundColor: theme.bg }]} />
      <View style={[styles.line, { backgroundColor: theme.line, opacity: 0.25, width: '70%' }]} />
      <View style={[styles.line, { backgroundColor: theme.line, opacity: 0.18, width: '46%' }]} />
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    width: '100%',
  },
  hole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: BORDER_WIDTH,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
});
