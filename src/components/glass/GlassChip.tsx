import { StyleSheet, Text, View } from 'react-native';
import type { Icon } from 'phosphor-react-native';

import { glassMaterial } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface GlassChipProps {
  label: string;
  icon?: Icon;
  /** 'amber' uyarılar için sıcak ton. */
  tone?: 'default' | 'amber';
}

/** Küçük cam çip: ikon + tek satır etiket. */
export function GlassChip({ label, icon: IconComponent, tone = 'default' }: GlassChipProps) {
  const theme = useAppTheme();
  const material = glassMaterial(theme, 'chip');
  const amber = tone === 'amber';
  const fg = amber ? theme.onAccent : theme.text;
  const iconColor = amber ? theme.onAccent : theme.textSecondary;

  return (
    <View
      style={[
        styles.chip,
        amber && styles.chipAmber,
        {
          backgroundColor: amber ? theme.accent : material.fill,
          borderColor: amber ? 'transparent' : material.border,
        },
      ]}
    >
      {IconComponent ? <IconComponent size={14} color={iconColor} weight="bold" /> : null}
      <Text style={[typography.micro, { color: fg }]} numberOfLines={amber ? undefined : 1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  chipAmber: {
    // Uyarı metinleri cümle uzunluğunda: tam genişlikte alt satıra kayar,
    // üç nokta ile kesilmez.
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
});
