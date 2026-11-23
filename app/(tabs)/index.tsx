import {
  CaretRight,
  CloudRain,
  Drop,
  MapPin,
  NavigationArrow,
  Wind,
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
import { LoadingView } from '@/components/LoadingView';
import { WelcomeView } from '@/components/WelcomeView';
import { WeatherIcon } from '@/components/WeatherIcon';
import {
  Glass,
  GlassChip,
  GlassSegmented,
  ScreenBackground,
} from '@/components/glass';
import { glassMaterial } from '@/theme/glass';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useProfile } from '@/hooks/useProfile';
import { useTabFade } from '@/hooks/useTabFade';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { locale, t } from '@/i18n';
import { onScrollToTopRequest } from '@/lib/scrollToTop';
import { garmentLabel } from '@/logic/garmentCatalog';
import { adviceLines, buildDayOutfit, defaultDayOffset, upcomingSlots } from '@/logic/outfitEngine';
import { uniqueLines } from '@/logic/outfitGrouping';
import { buildSlotWeathers } from '@/logic/slots';
import { getWeatherCondition, getWeatherVisual } from '@/logic/weatherCodes';
import { warningIcon } from '@/logic/warningIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, SCREEN_PADDING, spacing } from '@/theme/spacing';
import { FONT_FAMILY, typography } from '@/theme/typography';

function formatClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

/** Bugün: konum başlığı, segmented, hero cam kart, kıyafet kartı, gün boyu, saatlik şerit. */
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
  const fadeStyle = useTabFade();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(
    () =>
      onScrollToTopRequest('index', () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }),
    []
  );
  const dayOffset = snapshot ? (dayChoice ?? defaultDayOffset(snapshot)) : 0;

  const dayOutfit = useMemo(
    () => (snapshot ? buildDayOutfit(snapshot, outfitProfile, dayOffset) : null),
    [snapshot, outfitProfile, dayOffset]
  );
  const slotWeathers = useMemo(
    () => (snapshot && dayOutfit ? buildSlotWeathers(snapshot, dayOutfit.date, outfitProfile) : []),
    [snapshot, dayOutfit, outfitProfile]
  );
  const showOffline = isOffline || isOnline === false;

  const backdrop = !snapshot
    ? { kind: 'cloudy' as const, isDay: true }
    : (() => {
        const visual = getWeatherVisual(snapshot.current.weatherCode, snapshot.current.isDay);
        return { kind: visual.kind, isDay: snapshot.current.isDay };
      })();

  let body: React.ReactNode;
  if (status === 'welcome') {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <WelcomeView onUseLocation={() => void loadMyLocation()} isBusy={false} />
      </View>
    );
  } else if (status === 'loading' || status === 'idle') {
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
    // Açıklama: en fazla iki satır + gün notu; aynı cümle iki kez görünmez.
    const description = uniqueLines([
      ...adviceLines(dayOutfit),
      ...(dayOutfit.dailyNote ? [dayOutfit.dailyNote] : []),
    ]).join(' ');
    // Uyarı çipleri: açıklamada zaten geçen cümleler tekrarlanmaz.
    const chipWarnings = dayOutfit.warnings.filter(
      (warning) => !description.includes(warning)
    );
    const headerButtonMaterial = glassMaterial(theme, 'pill');

    body = (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={theme.tabActive}
            colors={[theme.tabActive]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header: konum + mevcut konum cam butonu */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.push('/ayarlar/konumlar')}
            accessibilityRole="button"
            style={styles.placeWrap}
          >
            <View style={styles.placeTitleRow}>
              <MapPin size={18} color={theme.tabActive} weight="regular" />
              <Text style={[typography.titleM, { color: theme.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {place.name}
              </Text>
            </View>
            <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
              {place.region || place.country}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void loadMyLocation()}
            accessibilityRole="button"
            accessibilityLabel={t('common.myLocation')}
            style={[
              styles.iconButton,
              {
                borderColor: headerButtonMaterial.border,
                backgroundColor: headerButtonMaterial.fill,
              },
            ]}
          >
            <NavigationArrow size={18} color={theme.text} weight="regular" />
          </Pressable>
        </View>

        <GlassSegmented
          options={[
            { value: 0 as const, label: t('day.today') },
            { value: 1 as const, label: t('day.tomorrow') },
          ]}
          value={dayOffset}
          onChange={(next) => setDayChoice(next)}
        />

        {/* Kıyafet önerisi: büyük başlık + açıklama + sabah/öğle/akşam saatlik şerit */}
        <Animated.View entering={FadeInDown.duration(300).delay(60)}>
          <Glass blur>
            <Text style={[typography.titleL, { color: theme.text }]} maxFontSizeMultiplier={1.15}>
              {dayOutfit.title}
            </Text>
            {description ? (
              <Text style={[typography.body, styles.cardDesc, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3} numberOfLines={3}>
                {description}
              </Text>
            ) : null}
            <View style={[styles.slotStrip, { borderTopColor: 'rgba(120,140,165,0.28)' }]}>
              {upcomingSlots(dayOutfit).map((slot, index) => {
                const weather = slotWeathers.find((item) => item.slot === slot.slot);
                const muted = weather?.past ?? false;
                const ink = muted ? theme.textSecondary : theme.text;
                return (
                  <View
                    key={slot.slot}
                    style={[styles.slotCell, index > 0 && styles.slotCellDivider]}
                  >
                    <Text style={[typography.micro, { color: theme.textSecondary }]}>{t(`slot.${slot.slot}`)}</Text>
                    <Text style={[typography.caption, { color: ink }]} numberOfLines={1}>
                      {weather?.hourLabel}
                    </Text>
                    {weather ? (
                      <WeatherIcon
                        kind={getWeatherVisual(weather.dominantCode, weather.isDay).kind}
                        isDay={weather.isDay}
                        size={20}
                        color={ink}
                      />
                    ) : null}
                    <Text style={[typography.titleS, { color: ink }]}>
                      {weather ? `${Math.round(weather.avgApparent)}°` : ''}
                    </Text>
                    <Text style={[typography.micro, { color: theme.textSecondary }]} numberOfLines={1}>
                      {garmentLabel(slot.hero)}
                    </Text>
                  </View>
                );
              })}
            </View>
            {chipWarnings.length > 0 ? (
              <View style={styles.chipWrap}>
                {chipWarnings.map((warning) => (
                  <GlassChip key={warning} label={warning} icon={warningIcon(warning)} tone="amber" />
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={() => router.push('/oneri')}
              accessibilityRole="button"
              accessibilityLabel={t('outfit.viewDetails')}
              style={({ pressed }) => [styles.detailLink, pressed && styles.detailLinkPressed]}
            >
              <Text style={[typography.caption, { color: theme.tabActive }]}>
                {t('outfit.viewDetails')}
              </Text>
              <CaretRight size={16} color={theme.tabActive} weight="bold" />
            </Pressable>
          </Glass>
        </Animated.View>

        {/* Hero kart: durum/min-max, dev sıcaklık, hissedilen, rüzgâr/nem/yağış */}
        <Animated.View entering={FadeInDown.duration(300).delay(120)}>
          <Glass blur cornerRadius={radius.card}>
            <View style={styles.heroTop}>
              <WeatherIcon
                kind={getWeatherVisual(current.weatherCode, current.isDay).kind}
                isDay={current.isDay}
                size={72}
                color={theme.tabActive}
                weight="duotone"
              />
              <View style={styles.heroCondition}>
                <Text style={[typography.titleM, { color: theme.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {condition}
                </Text>
                {daily ? (
                  <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                    {`${t('outfit.minTemp', { temp: Math.round(daily.temperatureMin) })} · ${t('outfit.maxTemp', { temp: Math.round(daily.temperatureMax) })}`}
                  </Text>
                ) : null}
              </View>
            </View>
            <Animated.View key={Math.round(current.temperature)} entering={FadeIn.duration(200)}>
              <Text style={[styles.heroTemp, { color: theme.text }]} maxFontSizeMultiplier={1.05}>
                {`${Math.round(current.temperature)}°`}
              </Text>
            </Animated.View>
            <Text style={[typography.body, { color: theme.textSecondary }]}>
              {t('outfit.feels', { temp: Math.round(current.apparentTemperature) })}
            </Text>
            <View style={[styles.heroDivider, { borderTopColor: 'rgba(120,140,165,0.28)' }]} />
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Wind size={16} color={theme.textSecondary} weight="regular" />
                <Text style={[typography.caption, { color: theme.text }]}>{`${wind} km/sa`}</Text>
                <Text style={[typography.micro, { color: theme.textSecondary }]}>{t('outfit.windLabel')}</Text>
              </View>
              <View style={styles.heroStat}>
                <Drop size={16} color={theme.textSecondary} weight="regular" />
                <Text style={[typography.caption, { color: theme.text }]}>{`%${Math.round(current.humidity)}`}</Text>
                <Text style={[typography.micro, { color: theme.textSecondary }]}>{t('outfit.humidityLabel')}</Text>
              </View>
              <View style={styles.heroStat}>
                <CloudRain size={16} color={theme.textSecondary} weight="regular" />
                <Text style={[typography.caption, { color: theme.text }]}>{`%${rain}`}</Text>
                <Text style={[typography.micro, { color: theme.textSecondary }]}>{t('outfit.rainLabel')}</Text>
              </View>
            </View>
          </Glass>
        </Animated.View>

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
    <ScreenBackground kind={backdrop.kind}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Animated.View style={[styles.flex, fadeStyle]}>{body}</Animated.View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeWrap: {
    flex: 1,
    gap: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroCondition: {
    flex: 1,
    gap: 2,
  },
  heroTemp: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 88,
    lineHeight: 96,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.sm,
  },
  heroDivider: {
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  cardDesc: {
    marginTop: spacing.xs,
  },
  slotStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  slotCell: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  slotCellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(120,140,165,0.28)',
    paddingLeft: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    marginTop: spacing.sm,
  },
  detailLinkPressed: {
    opacity: 0.6,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
