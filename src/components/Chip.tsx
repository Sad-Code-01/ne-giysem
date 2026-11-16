import { StyleSheet, Text, View } from 'react-native';
import type { Icon } from 'phosphor-react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import type { AppTheme } from '@/theme/tokens';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface ChipProps {
  label: string;
  icon?: Icon;
  tone?: 'default' | 'amber' | 'ice';
}

function toneColors(theme: AppTheme, tone: ChipProps['tone']): { bg: string; fg: string } {
  switch (tone) {
    case 'amber':
      return { bg: theme.accent, fg: theme.onAccent };
    case 'ice':
      return { bg: theme.secondary, fg: theme.onPrimary };
    default:
      return { bg: theme.primary, fg: theme.onPrimary };
  }
}

/** Küçük etiket. Dolgu ton rengidir; metin ve ikon zemin rengi. */
export function Chip({ label, icon: IconComponent, tone = 'default' }: ChipProps) {
  const theme = useAppTheme();
  const { bg, fg } = toneColors(theme, tone);
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {IconComponent ? <IconComponent size={14} color={fg} weight="bold" /> : null}
      <Text style={[typography.micro, { color: fg }]} numberOfLines={1}>
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
    borderRadius: radius.sm,
    borderWidth: BORDER_WIDTH,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
});
