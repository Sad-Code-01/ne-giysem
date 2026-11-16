import { MagnifyingGlass, MapPin } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/ErrorView';
import { GarmentIcon } from '@/components/GarmentIcon';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Surface } from '@/components/Surface';
import { TagCard } from '@/components/TagCard';
import { WarningChips } from '@/components/WarningChips';
import { WarningLine } from '@/components/WarningLine';
import { WeatherIcon } from '@/components/WeatherIcon';
import { WelcomeView } from '@/components/WelcomeView';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useProfile } from '@/hooks/useProfile';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { locale, t } from '@/i18n';
import { garmentLabel } from '@/logic/garmentCatalog';
import { adviceLines, buildDayOutfit, defaultDayOffset } from '@/logic/outfitEngine';
import { buildSlotWeathers } from '@/logic/slots';
import { getWeatherCondition, getWeatherVisual } from '@/logic/weatherCodes';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { HourlyPoint } from '@/types';

function formatClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

/** Bugün: konum başlığı, hero kart, kıyafet kartı, gün boyu, saatlik şerit. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();
  const { outfitProfile } = useProfile();
  const router = useRouter();
  const {
    status,
    snapshot,
    errorKind,
    isOffline,
    isRefreshing,
    lastUpdatedLabel,
    loadMyLocation,
    refresh,
  } = useWeatherContext();

  const [dayChoice, setDayChoice] = useState<0 | 1 | null>(null);
  const dayOffset = snapshot ? (dayChoice ?? defaultDayOffset(snapshot)) : 0;

  const dayOutfit = useMemo(
    () => (snapshot ? buildDayOutfit(snapshot, outfitProfile, dayOffset) : null),
    [snapshot, outfitProfile, dayOffset]
  );
  const slotWeathers = useMemo(
    () => (snapshot && dayOutfit ? buildSlotWeathers(snapshot, dayOutfit.date, outfitProfile) : []),
    [snapshot, dayOutfit, outfitProfile]
  );

  // Seçili günün saatlik noktaları (en fazla 24).
  const hourlyStrip = useMemo<HourlyPoint[]>(() => {
    if (!snapshot || !dayOutfit) return [];
    return snapshot.hourly.filter((point) => point.time.startsWith(dayOutfit.date)).slice(0, 24);
  }, [snapshot, dayOutfit]);

  const showOffline = isOffline || isOnline === false;

  let body: React.ReactNode;
  if (status === 'welcome') {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <WelcomeView onUseLocation={() => void loadMyLocation()} isBusy={false} />
      </View>
    );
  } else if ((status === 'loading' || status === 'idle') && !snapshot) {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <LoadingView />
      </View>
    );
  } else if (status === 'error' || !snapshot || !dayOutfit) {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ErrorView kind={errorKind ?? 'api'} onRetry={() => void loadMyLocation()} />
      </View>
    );
  } else {
    const { current, place } = snapshot;
    const daily = snapshot.daily.find((day) => day.date === dayOutfit.date && !day.isPast);
    const wind = Math.round(daily?.windSpeedMax ?? current.windSpeed);
    const rain = Math.round(daily?.precipitationProbabilityMax ?? current.precipitationProbability);
    const condition = getWeatherCondition(current.weatherCode).label;
    const lines = adviceLines(dayOutfit);

    body = (
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push('/ayarlar/konumlar')}
            accessibilityRole="button"
            style={styles.place}
          >
            <MapPin size={16} color={theme.primary} weight="regular" />
            <Text style={[typography.caption, { color: theme.text }]} numberOfLines={1}>
              {place.name}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/sehir-ara')}
            accessibilityRole="button"
            accessibilityLabel={t('common.search')}
            style={[styles.iconButton, { borderColor: theme.line, backgroundColor: theme.surface }]}
          >
            <MagnifyingGlass size={18} color={theme.text} weight="regular" />
          </Pressable>
          <SegmentedControl
            options={[
              { value: 0 as const, label: t('day.today') },
              { value: 1 as const, label: t('day.tomorrow') },
            ]}
            value={dayOffset}
            onChange={(next) => setDayChoice(next)}
          />
        </View>

        <Text style={[typography.display, { color: theme.text }]} maxFontSizeMultiplier={1.15}>
          {dayOutfit.title}
        </Text>
        {dayOutfit.avoidNote ? (
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {dayOutfit.avoidNote}
          </Text>
        ) : null}

        {/* Hero kart: sıcaklık, durum, min/max, his, rüzgâr/yağış/nem */}
        <Surface>
          <View style={styles.heroTop}>
            <View style={styles.heroTempWrap}>
              <Text style={[typography.display, { color: theme.text }]} maxFontSizeMultiplier={1.1}>
                {`${Math.round(current.temperature)}°`}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary }]} numberOfLines={1}>
                {condition}
              </Text>
            </View>
            <WeatherIcon
              kind={getWeatherVisual(current.weatherCode, current.isDay).kind}
              isDay={current.isDay}
              size={56}
              color={theme.primary}
              weight="duotone"
            />
          </View>
          <View style={styles.heroStats}>
            {daily ? (
              <Text style={[typography.caption, { color: theme.textSecondary }]}>
                {`${t('outfit.lowShort', { temp: Math.round(daily.temperatureMin) })} · ${t('outfit.highShort', { temp: Math.round(daily.temperatureMax) })}`}
              </Text>
            ) : null}
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {`${t('outfit.feels', { temp: Math.round(current.apparentTemperature) })} · ${t('outfit.windLabel')} ${wind} km/sa · ${t('outfit.rainLabel')} %${rain} · ${t('outfit.humidityLabel')} %${Math.round(current.humidity)}`}
            </Text>
          </View>
        </Surface>

        {/* Kıyafet kartı: slot başına kategori ikonlu satırlar + uyarı çipleri */}
        <Surface>
          <Text style={[typography.titleS, { color: theme.text }]}>{t('outfit.cardLabel')}</Text>
          <View style={styles.outfitRows}>
            {dayOutfit.slots.map((slot) => (
              <View key={slot.slot} style={styles.outfitRow}>
                <Text style={[typography.caption, styles.slotLabel, { color: theme.textSecondary }]}>
                  {t(`slot.${slot.slot}`)}
                </Text>
                <View style={styles.itemChips}>
                  {slot.items.map((item) => (
                    <View
                      key={item.id}
                      style={[styles.itemChip, { backgroundColor: theme.bg, borderColor: theme.line }]}
                    >
                      <GarmentIcon garment={item} size={15} color={theme.textSecondary} />
                      <Text style={[typography.micro, { color: theme.text }]} numberOfLines={1}>
                        {garmentLabel(item)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <WarningChips warnings={dayOutfit.warnings} />
        </Surface>

        {/* Gün boyu: sabah/öğle/akşam */}
        <TagCard>
          <View style={styles.slots}>
            {dayOutfit.slots.map((slot, index) => {
              const weather = slotWeathers.find((item) => item.slot === slot.slot);
              const muted = weather?.past ?? false;
              const ink = muted ? theme.textSecondary : theme.text;
              const slotCondition = weather ? getWeatherCondition(weather.dominantCode).label : '';
              return (
                <View
                  key={slot.slot}
                  style={[
                    styles.slot,
                    index > 0 && { borderLeftWidth: 1.5, borderLeftColor: theme.line },
                  ]}
                >
                  <Text style={[typography.caption, { color: ink }]}>{t(`slot.${slot.slot}`)}</Text>
                  <Text style={[typography.micro, { color: theme.textSecondary }]}>{weather?.hourLabel}</Text>
                  <Text style={[typography.caption, { color: ink }]} numberOfLines={2}>
                    {slotCondition}
                  </Text>
                  <Text style={[typography.metric, { color: ink }]}>
                    {weather ? `${Math.round(weather.avgApparent)}°` : ''}
                  </Text>
                  <Text style={[typography.titleM, { color: ink }]} numberOfLines={2}>
                    {garmentLabel(slot.hero)}
                  </Text>
                </View>
              );
            })}
          </View>
        </TagCard>

        {/* Saatlik şerit */}
        {hourlyStrip.length > 0 ? (
          <View style={styles.hourlyWrap}>
            <Text style={[typography.titleS, { color: theme.text }]}>{t('hourly.title')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyRow}>
              {hourlyStrip.map((point) => {
                const visual = getWeatherVisual(point.weatherCode, point.isDay);
                return (
                  <View key={point.time} style={[styles.hourCell, { borderColor: theme.line, backgroundColor: theme.surface }]}>
                    <Text style={[typography.micro, { color: theme.textSecondary }]}>
                      {point.time.slice(11, 16)}
                    </Text>
                    <WeatherIcon kind={visual.kind} isDay={point.isDay} size={20} color={theme.textSecondary} />
                    <Text style={[typography.caption, { color: theme.text }]}>{`${Math.round(point.temperature)}°`}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <WarningLine lines={lines} />
        {dayOutfit.dailyNote ? (
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {dayOutfit.dailyNote}
          </Text>
        ) : null}
        {showOffline ? (
          <Text style={[typography.caption, { color: theme.text }]}>
            {lastUpdatedLabel
              ? t('outfit.offlineChip', { time: lastUpdatedLabel })
              : t('outfit.offlineNoTime')}
          </Text>
        ) : null}
        <Text style={[typography.micro, styles.footer, { color: theme.textSecondary }]}>
          {t('outfit.dataAttribution')} · {t('outfit.lastUpdate', { time: formatClock(snapshot.fetchedAt) })}
        </Text>
      </ScrollView>
    );
  }

  return (
    <Screen>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    minHeight: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroTempWrap: {
    gap: 2,
  },
  heroStats: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  outfitRows: {
    gap: spacing.sm,
  },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  slotLabel: {
    width: 52,
    paddingTop: 4,
  },
  itemChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    borderWidth: BORDER_WIDTH,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  slots: {
    flexDirection: 'row',
  },
  slot: {
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hourlyWrap: {
    gap: spacing.sm,
  },
  hourlyRow: {
    gap: spacing.sm,
    paddingRight: SCREEN_PADDING,
  },
  hourCell: {
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.sm,
    borderWidth: BORDER_WIDTH,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 64,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
