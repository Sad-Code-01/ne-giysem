import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Check,
  CheckCircle,
  Snowflake,
  Sun,
  ThumbsDown,
  Umbrella,
  type Icon,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/ErrorView';
import { GarmentIcon } from '@/components/GarmentIcon';
import { LoadingView } from '@/components/LoadingView';
import { WelcomeView } from '@/components/WelcomeView';
import { WeatherIcon } from '@/components/WeatherIcon';
import {
  Glass,
  GlassChip,
  GlassSegmented,
  IconBadge,
  ScreenBackground,
} from '@/components/glass';
import { SheetModal } from '@/components/SheetModal';
import { useProfile } from '@/hooks/useProfile';
import { useTabFade } from '@/hooks/useTabFade';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { garmentLabel } from '@/logic/garmentCatalog';
import { garmentIcon } from '@/logic/itemIcons';
import { adviceLines, buildDayOutfit, defaultDayOffset, upcomingSlots } from '@/logic/outfitEngine';
import { applyFeedbackToOffset, type OutfitFeedback } from '@/logic/feedback';
import { groupOutfitItems, joinGarmentNames, uniqueLines } from '@/logic/outfitGrouping';
import { buildSlotWeathers } from '@/logic/slots';
import { getWeatherVisual } from '@/logic/weatherCodes';
import { warningIcon } from '@/logic/warningIcons';
import { onScrollToTopRequest } from '@/lib/scrollToTop';
import { getFeedbackFor, recordFeedback } from '@/storage/feedback';
import { locale, t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DayOutfit, IllustrationKind } from '@/types';

const WEEK_DAYS = 7;

function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale(), { weekday: 'short' });
}

function dateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

type ViewMode = 'daily' | 'weekly';

const FEEDBACK_OPTIONS: readonly { value: OutfitFeedback; labelKey: string; icon: Icon }[] = [
  { value: 'cold', labelKey: 'feedback.cold', icon: Snowflake },
  { value: 'perfect', labelKey: 'feedback.perfect', icon: CheckCircle },
  { value: 'hot', labelKey: 'feedback.hot', icon: Sun },
  { value: 'rain', labelKey: 'feedback.rain', icon: Umbrella },
  { value: 'dislike', labelKey: 'feedback.dislike', icon: ThumbsDown },
];

/**
 * "Ne Giysem?" sekmesi: günlük detaylı kombin (bugün/yarın) ve
 * haftalık gün gün kombin özeti; güne dokununca slot detayı açılır.
 */
export default function OutfitScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { outfitProfile, profile, setLearnedOffset } = useProfile();
  const { status, snapshot, errorKind, loadMyLocation } = useWeatherContext();
  const [mode, setMode] = useState<ViewMode>('daily');
  const [dayChoice, setDayChoice] = useState<0 | 1 | null>(null);
  const [selected, setSelected] = useState<DayOutfit | null>(null);
  const [feedback, setFeedback] = useState<OutfitFeedback | null>(null);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const wardrobeIds = useMemo(() => new Set(profile.wardrobe), [profile.wardrobe]);
  const fadeStyle = useTabFade();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(
    () =>
      onScrollToTopRequest('oneri', () => {
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

  const weekDays = useMemo(() => {
    if (!snapshot) return [];
    return Array.from({ length: WEEK_DAYS }, (_, offset) => {
      const outfit = buildDayOutfit(snapshot, outfitProfile, offset);
      const daily = snapshot.daily.find((day) => day.date === outfit.date && !day.isPast);
      return { outfit, daily };
    });
  }, [snapshot, outfitProfile]);

  // Geri bildirim yalnızca bugün (offset 0) için sorulur; gün başına bir kez.
  const feedbackDate = dayOffset === 0 && dayOutfit ? dayOutfit.date : null;
  useEffect(() => {
    let live = true;
    const date = feedbackDate;
    void (async () => {
      const value = date ? await getFeedbackFor(date) : null;
      if (!live) return;
      setFeedback(value);
      setFeedbackLoaded(true);
    })();
    return () => {
      live = false;
    };
  }, [feedbackDate]);

  const handleFeedback = async (value: OutfitFeedback): Promise<void> => {
    if (!feedbackDate || feedback) return;
    setFeedback(value);
    await recordFeedback(feedbackDate, value);
    await setLearnedOffset(applyFeedbackToOffset(profile.learnedOffset, value));
  };

  const selectedSlotWeathers = useMemo(() => {
    if (!snapshot || !selected) return [];
    return buildSlotWeathers(snapshot, selected.date, outfitProfile);
  }, [snapshot, selected, outfitProfile]);

  const backdrop: IllustrationKind = !snapshot
    ? 'cloudy'
    : getWeatherVisual(snapshot.current.weatherCode, snapshot.current.isDay).kind;

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
  } else if (status === 'error' || !snapshot || !dayOutfit) {
    body = (
      <View style={[styles.centered, { paddingTop: insets.top + spacing.xxl }]}>
        <ErrorView kind={errorKind ?? 'api'} onRetry={() => void loadMyLocation()} />
      </View>
    );
  } else {
    body = (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={[typography.titleL, { color: theme.text }]}>{t('tab.outfit')}</Text>
          {snapshot.place.region ? (
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {snapshot.place.region}
            </Text>
          ) : null}
        </Animated.View>

        <GlassSegmented
          options={[
            { value: 'daily' as ViewMode, label: t('outfits.daily') },
            { value: 'weekly' as ViewMode, label: t('outfits.weekly') },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'daily' ? (
          <DailyView
            outfit={dayOutfit}
            slotWeathers={slotWeathers}
            dayOffset={dayOffset}
            onDayChange={setDayChoice}
            feedback={feedback}
            feedbackLoaded={feedbackLoaded}
            wardrobeIds={wardrobeIds}
            onFeedback={(value) => void handleFeedback(value)}
          />
        ) : (
          <View style={styles.list}>
            {weekDays.map(({ outfit, daily }, index) => (
              <Animated.View key={outfit.date} entering={FadeInDown.delay(40 + index * 40).duration(280)}>
                <Pressable
                  onPress={() => setSelected(outfit)}
                  accessibilityRole="button"
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Glass contentStyle={styles.weekRow}>
                    <View style={styles.weekLeft}>
                      <Text style={[typography.caption, { color: theme.textSecondary }]}>
                        {`${weekdayLabel(outfit.date)} · ${dateLabel(outfit.date)}`}
                      </Text>
                      <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
                        {garmentLabel(outfit.dayHero)}
                      </Text>
                      {daily ? (
                        <Text style={[typography.micro, { color: theme.textSecondary }]}>
                          {`${Math.round(daily.temperatureMin)}° / ${Math.round(daily.temperatureMax)}°`}
                          {daily.precipitationProbabilityMax > 0
                            ? ` · %${Math.round(daily.precipitationProbabilityMax)}`
                            : ''}
                        </Text>
                      ) : null}
                    </View>
                    {daily ? (
                      <WeatherIcon
                        kind={getWeatherVisual(daily.weatherCode, true).kind}
                        isDay
                        size={30}
                        color={theme.tabActive}
                      />
                    ) : null}
                  </Glass>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScreenBackground kind={backdrop}>
      <Animated.View style={[styles.flex, fadeStyle]}>{body}</Animated.View>
      <SheetModal
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${weekdayLabel(selected.date)} · ${dateLabel(selected.date)}` : undefined}
      >
        {selected ? (
          <View style={styles.sheetContent}>
            <Glass>
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
                {upcomingSlots(selected).map((outfit) => {
                  const weather = selectedSlotWeathers.find((item) => item.slot === outfit.slot);
                  return (
                    <View key={outfit.slot} style={styles.planRow}>
                      <Text style={[typography.caption, { color: theme.textSecondary, width: 64 }]} numberOfLines={1}>
                        {t(`slot.${outfit.slot}`)}
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
            </Glass>
          </View>
        ) : null}
      </SheetModal>
    </ScreenBackground>
  );
}

/** Günlük görünüm: gün seçici + başlık/açıklama + gruplar + slotlar. */
function DailyView({
  outfit,
  slotWeathers,
  dayOffset,
  onDayChange,
  feedback,
  feedbackLoaded,
  wardrobeIds,
  onFeedback,
}: {
  outfit: DayOutfit;
  slotWeathers: ReturnType<typeof buildSlotWeathers>;
  dayOffset: number;
  onDayChange: (next: 0 | 1) => void;
  feedback: OutfitFeedback | null;
  feedbackLoaded: boolean;
  wardrobeIds: ReadonlySet<string>;
  onFeedback: (value: OutfitFeedback) => void;
}) {
  const theme = useAppTheme();
  const visibleSlots = upcomingSlots(outfit);
  const mainSlot = visibleSlots.find((slot) => slot.slot === 'ogle') ?? visibleSlots[1] ?? visibleSlots[0];
  const groups = groupOutfitItems(mainSlot?.items ?? []);
  const description = uniqueLines([
    ...adviceLines(outfit),
    ...(outfit.dailyNote ? [outfit.dailyNote] : []),
  ]).join(' ');
  const chipWarnings = outfit.warnings.filter((warning) => !description.includes(warning));

  return (
    <View style={styles.dailyWrap}>
      <GlassSegmented
        options={[
          { value: 0 as const, label: t('day.today') },
          { value: 1 as const, label: t('day.tomorrow') },
        ]}
        value={dayOffset as 0 | 1}
        onChange={onDayChange}
      />

      <Animated.View entering={FadeInDown.duration(280)}>
        <Glass>
          <Text style={[typography.titleS, { color: theme.text }]}>{outfit.title}</Text>
          {description ? (
            <Text style={[typography.body, styles.cardDesc, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {description}
            </Text>
          ) : null}
          {chipWarnings.length > 0 ? (
            <View>
              <Text style={[typography.micro, { color: theme.textSecondary }]}>{t('outfit.appWarnings')}</Text>
              <View style={styles.chipWrap}>
                {chipWarnings.map((warning) => (
                  <GlassChip key={warning} label={warning} icon={warningIcon(warning)} tone="amber" />
                ))}
              </View>
            </View>
          ) : null}
          {dayOffset === 0 && feedbackLoaded ? (
            <View style={styles.feedbackBlock}>
              {feedback ? (
                <Text style={[typography.micro, { color: theme.textSecondary }]}>
                  {t('feedback.thanks')}
                </Text>
              ) : (
                <>
                  <Text style={[typography.micro, { color: theme.textSecondary }]}>
                    {t('feedback.ask')}
                  </Text>
                  <View style={styles.chipWrap}>
                    {FEEDBACK_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => onFeedback(option.value)}
                        accessibilityRole="button"
                        style={({ pressed }) => (pressed ? styles.pressed : null)}
                      >
                        <GlassChip label={t(option.labelKey)} icon={option.icon} />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : null}
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(280)}>
        <Glass contentStyle={styles.groupsCard}>
          {groups.map((group) => {
            const representative = group.items.reduce(
              (best, item) => (item.warmth > best.warmth ? item : best),
              group.items[0]
            );
            const RowIcon = garmentIcon(representative);
            return (
              <View key={group.key} style={styles.groupRow}>
                <IconBadge icon={RowIcon} size={18} boxSize={36} />
                <View style={styles.groupText}>
                  <Text style={[typography.micro, { color: theme.textSecondary }]} numberOfLines={1}>
                    {t(group.labelKey)}
                  </Text>
                  <Text style={[typography.body, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                    {joinGarmentNames(group)}
                  </Text>
                </View>
                {group.items.every((item) => wardrobeIds.has(item.id)) ? (
                  <Check size={16} color={theme.tabActive} weight="bold" />
                ) : null}
              </View>
            );
          })}
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(280)}>
        <Glass padded={false} contentStyle={styles.slotsCard}>
          <View style={styles.slots}>
            {upcomingSlots(outfit).map((slot, index) => {
              const weather = slotWeathers.find((item) => item.slot === slot.slot);
              const muted = weather?.past ?? false;
              const ink = muted ? theme.textSecondary : theme.text;
              return (
                <View
                  key={slot.slot}
                  style={[
                    styles.slot,
                    index > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(120,140,165,0.28)' },
                  ]}
                >
                  <Text style={[typography.micro, { color: theme.textSecondary }]}>{t(`slot.${slot.slot}`)}</Text>
                  <Text style={[typography.caption, { color: ink }]} numberOfLines={1}>
                    {weather?.hourLabel}
                  </Text>
                  {weather ? (
                    <WeatherIcon
                      kind={getWeatherVisual(weather.dominantCode, weather.isDay).kind}
                      isDay={weather.isDay}
                      size={22}
                      color={ink}
                    />
                  ) : null}
                  <Text style={[typography.titleS, { color: ink }]}>
                    {weather ? `${Math.round(weather.avgApparent)}°` : ''}
                  </Text>
                  <View style={[styles.slotChip, { borderColor: theme.line, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }]}>
                    <Text style={[typography.micro, { color: theme.text }]} numberOfLines={1}>
                      {garmentLabel(slot.hero)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Glass>
      </Animated.View>
    </View>
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
  dailyWrap: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  cardDesc: {
    marginTop: spacing.xs,
  },
  feedbackBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  groupsCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  groupText: {
    flex: 1,
    gap: 1,
  },
  slotsCard: {
    padding: spacing.md,
  },
  slots: {
    flexDirection: 'row',
  },
  slot: {
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
  },
  slotChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  weekLeft: {
    flex: 1,
    gap: 2,
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
