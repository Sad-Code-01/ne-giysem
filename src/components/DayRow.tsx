import { Pressable, StyleSheet, Text, View } from 'react-native';

import { garmentLabel } from '@/logic/garmentCatalog';
import { getWeatherCondition } from '@/logic/weatherCodes';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DailySummary, DayOutfit } from '@/types';

interface DayRowProps {
  dayOutfit: DayOutfit;
  daily: DailySummary | undefined;
  weekdayLabel: string;
  dateLabel: string;
  weekMin: number;
  weekMax: number;
  onPress: () => void;
}

/** Hafta satırı: gün, hava sözcüğü, kıyafet, şemsiye, maks/min. */
export function DayRow({ dayOutfit, daily, weekdayLabel, dateLabel, onPress }: DayRowProps) {
  const theme = useAppTheme();
  const rain = daily?.precipitationProbabilityMax ?? 0;
  const condition = getWeatherCondition(daily?.weatherCode ?? 3).label;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}
    >
      <View style={styles.day}>
        <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
          {weekdayLabel}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
          {dateLabel}
        </Text>
      </View>
      <Text style={[typography.caption, styles.mid, { color: theme.text }]} numberOfLines={2}>
        {condition}
      </Text>
      <View style={styles.end}>
        <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
          {garmentLabel(dayOutfit.dayHero)}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
          {daily ? `${Math.round(daily.temperatureMax)}° / ${Math.round(daily.temperatureMin)}°` : ''}
          {rain >= 40 ? ` · ${t('week.umbrella')}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    borderWidth: BORDER_WIDTH,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  day: {
    width: 64,
  },
  mid: {
    width: 72,
  },
  end: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
