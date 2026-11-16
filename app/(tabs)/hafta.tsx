import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayRow } from '@/components/DayRow';
import { ErrorView } from '@/components/ErrorView';
import { GarmentIcon } from '@/components/GarmentIcon';
import { GlassCard } from '@/components/GlassCard';
import { LoadingView } from '@/components/LoadingView';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SheetModal } from '@/components/SheetModal';
import { WeatherIcon } from '@/components/WeatherIcon';
import { WelcomeView } from '@/components/WelcomeView';
import { useProfile } from '@/hooks/useProfile';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { garmentLabel } from '@/logic/garmentCatalog';
import { buildDayOutfit } from '@/logic/outfitEngine';
import { buildSlotWeathers } from '@/logic/slots';
import { getWeatherVisual } from '@/logic/weatherCodes';
import { locale, t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DayOutfit } from '@/types';

const WEEK_DAYS = 7;

function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale(), { weekday: 'short' });
}

function dateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

/** Hafta sekmesi: 7 gün cam satırı + gün detayı alt sheet. */
export default function WeekScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { outfitProfile } = useProfile();
  const { status, snapshot, errorKind, loadMyLocation } = useWeatherContext();
  const [selected, setSelected] = useState<DayOutfit | null>(null);

  const days = useMemo(() => {
    if (!snapshot) return [];
    return Array.from({ length: WEEK_DAYS }, (_, offset) => {
      const outfit = buildDayOutfit(snapshot, outfitProfile, offset);
      const daily = snapshot.daily.find((day) => day.date === outfit.date && !day.isPast);
      return { outfit, daily };
    });
  }, [snapshot, outfitProfile]);

  const weekRange = useMemo(() => {
    const temps = days.flatMap(({ daily }) =>
      daily ? [daily.temperatureMin, daily.temperatureMax] : []
    );
    if (temps.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...temps), max: Math.max(...temps) };
  }, [days]);

  const selectedSlotWeathers = useMemo(() => {
    if (!snapshot || !selected) return [];
    return buildSlotWeathers(snapshot, selected.date, outfitProfile);
  }, [snapshot, selected, outfitProfile]);

  const backdrop = !snapshot
    ? { kind: 'cloudy' as const, isDay: true }
    : (() => {
        const visual = getWeatherVisual(snapshot.current.weatherCode, snapshot.current.isDay);
        return { kind: visual.kind, isDay: snapshot.current.isDay };
      })();

  let body: React.ReactNode;
  if (status === 'welcome') {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top + spacing.xxl }]}>
        <WelcomeView onUseLocation={() => void loadMyLocation()} isBusy={false} />
      </View>
    );
  } else if ((status === 'loading' || status === 'idle') && !snapshot) {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top + spacing.xxl }]}>
        <LoadingView />
      </View>
    );
  } else if (status === 'error' || !snapshot) {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top + spacing.xxl }]}>
        <ErrorView kind={errorKind ?? 'api'} onRetry={() => void loadMyLocation()} />
      </View>
    );
  } else {
    body = (
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(350)}>
          <Text style={[typography.titleL, { color: theme.text }]}>{t('week.title')}</Text>
        </Animated.View>
        <View style={styles.list}>
          {days.map(({ outfit, daily }, index) => (
            <Animated.View key={outfit.date} entering={FadeInDown.delay(60 + index * 40).duration(300)}>
              <DayRow
                dayOutfit={outfit}
                daily={daily}
                weekdayLabel={weekdayLabel(outfit.date)}
                dateLabel={dateLabel(outfit.date)}
                weekMin={weekRange.min}
                weekMax={weekRange.max}
                onPress={() => setSelected(outfit)}
              />
            </Animated.View>
          ))}
        </View>
        <Text style={[typography.caption, styles.footer, { color: theme.textSecondary }]}>
          {t('week.dataSource')}
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScreenBackground kind={backdrop.kind} isDay={backdrop.isDay}>
      {body}
      <SheetModal
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${weekdayLabel(selected.date)} · ${dateLabel(selected.date)}` : undefined}
      >
        {selected ? (
          <View style={styles.sheetContent}>
            <GlassCard>
              <View style={styles.sheetHero}>
                <GarmentIcon garment={selected.dayHero} size={40} color={theme.text} weight="duotone" />
                <View style={styles.sheetHeroText}>
                  <Text style={[typography.titleM, { color: theme.text }]} numberOfLines={2}>
                    {garmentLabel(selected.dayHero)}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={2}>
                    {selected.avoidNote ?? selected.dailyNote ?? selected.slots[1]?.bandLabel ?? ''}
                  </Text>
                </View>
              </View>
              <View style={styles.planList}>
                {selected.slots.map((outfit) => {
                  const weather = selectedSlotWeathers.find((item) => item.slot === outfit.slot);
                  return (
                    <View key={outfit.slot} style={styles.planRow}>
                      <Text style={[typography.caption, { color: theme.textSecondary, width: 64 }]} numberOfLines={1}>
                        {weather?.hourLabel ?? ''}
                      </Text>
                      {weather ? (
                        <WeatherIcon
                          kind={getWeatherVisual(weather.dominantCode, weather.isDay).kind}
                          isDay={weather.isDay}
                          size={20}
                          color={theme.textSecondary}
                        />
                      ) : null}
                      <Text style={[typography.metric, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                        {weather ? `${Math.round(weather.avgApparent)}°` : ''}
                      </Text>
                      <View style={styles.planChip}>
                        <GarmentIcon garment={outfit.hero} size={16} color={theme.textSecondary} />
                        <Text style={[typography.caption, { color: theme.text }]} numberOfLines={1}>
                          {garmentLabel(outfit.hero)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </View>
        ) : null}
      </SheetModal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  footer: {
    textAlign: 'center',
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sheetHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sheetHeroText: {
    flex: 1,
    gap: 2,
  },
  planList: {
    gap: spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 40,
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 140,
  },
});
