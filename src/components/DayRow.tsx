import { CloudRain } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Glass } from '@/components/glass';
import { GarmentIcon } from '@/components/GarmentIcon';
import { WeatherIcon } from '@/components/WeatherIcon';
import { garmentLabel } from '@/logic/garmentCatalog';
import { getWeatherCondition, getWeatherVisual } from '@/logic/weatherCodes';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DailySummary, DayOutfit } from '@/types';

interface DayRowProps {
  dayOutfit: DayOutfit;
  daily: DailySummary | undefined;
  weekdayLabel: string;
  dateLabel: string;
  weekMin: number;
  weekMax: number;
  /** Günün ortalama sıcaklığı (saatlik veriden); gösterilirse çubuğun yanında "Ort." etiketi. */
  avgTempC?: number | null;
  onPress: () => void;
}

/** Hafta satırı: gün+tarih, hava ikonu, min–max çubuğu, yağış %, kıyafet çipi. */
export function DayRow({
  dayOutfit,
  daily,
  weekdayLabel,
  dateLabel,
  weekMin,
  weekMax,
  avgTempC,
  onPress,
}: DayRowProps) {
  const theme = useAppTheme();
  const rain = daily?.precipitationProbabilityMax ?? 0;
  const weatherCode = daily?.weatherCode ?? 3;
  const visual = getWeatherVisual(weatherCode, true);
  const condition = getWeatherCondition(weatherCode).label;

  // Hafta aralığı içinde günün min–max konumu (0–1).
  const span = Math.max(weekMax - weekMin, 1);
  const left = daily ? Math.max(0, Math.min(1, (daily.temperatureMin - weekMin) / span)) : 0;
  const width = daily
    ? Math.max(0.04, Math.min(1 - left, (daily.temperatureMax - daily.temperatureMin) / span))
    : 0.2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${weekdayLabel} ${dateLabel}: ${condition}`}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Glass cornerRadius={radius.card} padding={spacing.md}>
        <View style={styles.topRow}>
          <View style={styles.day}>
            <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
              {weekdayLabel}
            </Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
              {dateLabel}
            </Text>
          </View>
          <WeatherIcon kind={visual.kind} isDay size={26} color={theme.tabActive} />
          <View style={styles.end}>
            <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
              {daily ? `${Math.round(daily.temperatureMax)}° / ${Math.round(daily.temperatureMin)}°` : ''}
            </Text>
            {rain >= 40 ? (
              <View style={styles.rainRow}>
                <CloudRain size={13} color={theme.tabActive} weight="regular" />
                <Text style={[typography.micro, { color: theme.tabActive }]}>{`%${Math.round(rain)}`}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Sıcaklık aralığı çubuğu + ortalama */}
        {daily ? (
          <View style={styles.trackWrap}>
            <View style={[styles.track, { backgroundColor: 'rgba(120,140,165,0.22)', flex: 1 }]}>
              <View
                style={[
                  styles.range,
                  {
                    left: `${left * 100}%`,
                    width: `${width * 100}%`,
                    backgroundColor: theme.tabActive,
                  },
                ]}
              />
            </View>
            {avgTempC != null ? (
              <Text style={[typography.micro, { color: theme.textSecondary }]}>
                {`Ort. ${Math.round(avgTempC)}°`}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Kısa kıyafet çipi */}
        <View style={styles.chipRow}>
          <GarmentIcon garment={dayOutfit.dayHero} size={14} color={theme.textSecondary} />
          <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
            {garmentLabel(dayOutfit.dayHero)}
          </Text>
        </View>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  day: {
    width: 64,
  },
  end: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  rainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trackWrap: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  range: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
