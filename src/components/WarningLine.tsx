import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface WarningLineProps {
  lines: readonly string[];
}

/** En fazla iki düz uyarı satırı. Çip ve ikon yok. */
export function WarningLine({ lines }: WarningLineProps) {
  const theme = useAppTheme();
  const visible = lines.slice(0, 2);
  if (visible.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {visible.map((line) => (
        <Text
          key={line}
          style={[typography.body, { color: theme.text }]}
          maxFontSizeMultiplier={1.3}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
});
