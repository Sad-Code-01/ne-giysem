import { Check } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, GlassButton, ScreenBackground } from '@/components/glass';
import { SheetModal } from '@/components/SheetModal';
import { TimeWheel } from '@/components/TimeWheel';
import { WeatherIcon } from '@/components/WeatherIcon';
import { useProfile } from '@/hooks/useProfile';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { t } from '@/i18n';
import { acceptConsent } from '@/storage/consent';
import { setOnboardingDone } from '@/storage/cache';
import { requestNotificationPermission } from '@/services/notificationService';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, MIN_TOUCH_SIZE, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { NotificationPeriod } from '@/storage/profileStore';
import type { ColdSensitivity, ServiceErrorKind } from '@/types';

/** Konum adımında hata türüne göre gösterilecek açıklama anahtarı. */
const LOCATION_ERROR_KEYS: Record<ServiceErrorKind, string> = {
  permission: 'error.permissionMsg',
  location: 'error.locationMsg',
  offline: 'error.offlineMsg',
  api: 'error.apiMsg',
  parse: 'error.parseMsg',
};

/** Hatırlatma dönemi: 12'den önce → bugünün, sonra → yarının kombini. */
function periodForHour(hour: number): NotificationPeriod {
  return hour < 12 ? 'sabah' : 'aksam';
}

const COLD_OPTIONS: readonly { value: ColdSensitivity; key: string }[] = [
  { value: 'none', key: 'cold.none' },
  { value: 'little', key: 'cold.little' },
  { value: 'normal', key: 'cold.normal' },
  { value: 'quick', key: 'cold.quick' },
  { value: 'very', key: 'cold.very' },
];

const STEP_COUNT = 5;

function progressLabel(step: number): string {
  return `${step + 1}/${STEP_COUNT}`;
}

/** Karşılama akışı: karşılama → gizlilik onayı → konum → bildirim. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { status, snapshot, errorKind, isOffline, start: startWeather, loadMyLocation } =
    useWeatherContext();
  const { profile, setColdSensitivity, setNotifEnabled, setNotifSchedule } = useProfile();

  const [step, setStep] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [awaitingPlace, setAwaitingPlace] = useState(false);
  // Konum isteğinin zamanı: yalnızca bu istekten SONRA gelen veri onay ekranını açar.
  const [placeRequestedAt, setPlaceRequestedAt] = useState(0);
  const [notifOn, setNotifOn] = useState(false);
  const [notifHour, setNotifHour] = useState(21);
  const [notifMinute, setNotifMinute] = useState(0);
  // null → profildeki kayıtlı değer kullanılır; seçim yapılınca üzerine yazılır.
  const [coldChoice, setColdChoice] = useState<ColdSensitivity | null>(null);
  const [busy, setBusy] = useState(false);

  const goTo = (next: number): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setStep(next);
  };

  // Konum adımı: istek sonrası gelen ilk TAZE snapshot onay kartını gösterir.
  // Otomatik ilerleme yok — kullanıcı seçtiği konumu görüp "Devam"a basar.
  // Bayat önbellek (isOffline) onay sayılmaz; hata mesajı da gösterilir.
  const placeReady =
    awaitingPlace &&
    status === 'ready' &&
    !isOffline &&
    snapshot != null &&
    snapshot.fetchedAt >= placeRequestedAt;
  // İstek yapıldı ama veri tazelenemedi: hata veya bayat önbellek.
  const placeFailed =
    awaitingPlace &&
    (status === 'error' || (status === 'ready' && isOffline));
  const locationErrorText = placeFailed
    ? t(LOCATION_ERROR_KEYS[errorKind ?? 'location'])
    : null;

  const handleUseLocation = async (): Promise<void> => {
    if (locationBusy) return;
    setLocationBusy(true);
    setAwaitingPlace(true);
    setPlaceRequestedAt(Date.now());
    try {
      // Konum akışıyla birlikte günlük hatırlatma iznini de iste —
      // GPS beklerken diyalog sırada beklemesin diye paralel başlat.
      void requestNotificationPermission();
      await loadMyLocation();
    } finally {
      setLocationBusy(false);
    }
  };

  const handleNotifToggle = async (value: boolean): Promise<void> => {
    if (!value) {
      setNotifOn(false);
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifOn(granted);
  };

  const finish = async (enableNotif: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      if (coldChoice) {
        await setColdSensitivity(coldChoice);
      }
      if (enableNotif && notifOn) {
        await setNotifSchedule(periodForHour(notifHour), notifHour, notifMinute);
        await setNotifEnabled(true);
      } else {
        await setNotifEnabled(false);
      }
      await setOnboardingDone(true);
      void startWeather();
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  const enterAnim = reduceMotion
    ? FadeIn.duration(260)
    : SlideInRight.springify().damping(30).stiffness(140);
  const exitAnim = reduceMotion ? FadeOut.duration(200) : SlideOutLeft.duration(260);

  const stepHeader = (
    <View style={styles.header}>
      {step > 0 ? (
        <Pressable
          onPress={() => goTo(step - 1)}
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('common.back')}</Text>
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <View style={styles.dots}>
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === step ? theme.primary : theme.line,
                width: index === step ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[typography.micro, { color: theme.textSecondary }]}>{progressLabel(step)}</Text>
    </View>
  );

  return (
    <ScreenBackground kind="partly">
      {/* Şeffaf logolu marka filigranı — tüm adımların arkasında */}
      <Image
        source={require('../assets/icon.png')}
        style={styles.bgLogo}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
        {stepHeader}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <Animated.View key="s0" entering={enterAnim} exiting={exitAnim} style={styles.step}>
              <WelcomeIcon />
              <Text style={[typography.micro, { color: theme.primary }]}>
                {t('welcome.appName').toLocaleUpperCase('tr-TR')}
              </Text>
              <Text style={[typography.titleL, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                {t('ob.welcomeTitle')}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {t('ob.welcomeSubtitle')}
              </Text>
              <View style={styles.actions}>
                <GlassButton label={t('ob.start')} onPress={() => goTo(1)} />
              </View>
            </Animated.View>
          ) : null}

          {step === 1 ? (
            <Animated.View key="s1" entering={enterAnim} exiting={exitAnim} style={styles.step}>
              <Text style={[typography.titleM, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                {t('ob.privacyTitle')}
              </Text>
              <ScrollView style={styles.privacyScroll} showsVerticalScrollIndicator={false}>
                <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                  {t('ob.privacyBody')}
                </Text>
              </ScrollView>
              <Pressable
                onPress={() => setConsentChecked((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consentChecked }}
                style={styles.checkRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: consentChecked ? theme.primary : theme.line,
                      backgroundColor: consentChecked ? theme.primary : theme.surface,
                    },
                  ]}
                >
                  {consentChecked ? (
                    <Text style={[typography.caption, { color: theme.onPrimary }]}>✓</Text>
                  ) : null}
                </View>
                <Text style={[typography.body, styles.checkLabel, { color: theme.text }]} maxFontSizeMultiplier={1.3}>
                  {t('ob.privacyCheck')}
                </Text>
              </Pressable>
              <Pressable onPress={() => setDetailsOpen(true)} accessibilityRole="button" style={styles.detailsLink}>
                <Text style={[typography.caption, { color: theme.primary }]}>{t('ob.privacyDetails')}</Text>
              </Pressable>
              {declined ? (
                <View style={styles.declinedBox}>
                  <Text style={[typography.body, { color: theme.text }]} maxFontSizeMultiplier={1.3}>
                    {t('ob.declineMsg')}
                  </Text>
                  <GlassButton label={t('common.back')} variant="secondary" onPress={() => { setDeclined(false); goTo(0); }} />
                </View>
              ) : (
                <View style={styles.actions}>
                  <GlassButton
                    label={t('common.next')}
                    disabled={!consentChecked}
                    onPress={() => {
                      void acceptConsent();
                      goTo(2);
                    }}
                  />
                  <GlassButton
                    label={t('ob.decline')}
                    variant="secondary"
                    onPress={() => setDeclined(true)}
                  />
                </View>
              )}
            </Animated.View>
          ) : null}

          {step === 2 ? (
            <Animated.View key="s2" entering={enterAnim} exiting={exitAnim} style={styles.step}>
              <Text style={[typography.titleM, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                {t('ob.locationTitle')}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {t('ob.locationBody')}
              </Text>
              {locationErrorText ? (
                <Text style={[typography.caption, { color: theme.text }]}>{locationErrorText}</Text>
              ) : null}

              {placeReady && snapshot ? (
                <Glass>
                  <View style={styles.placeReadyRow}>
                    <View style={styles.placeReadyText}>
                      <Text style={[typography.micro, { color: theme.textSecondary }]}>
                        {t('ob.placeReady')}
                      </Text>
                      <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
                        {snapshot.place.name}
                      </Text>
                      {snapshot.place.region ? (
                        <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                          {snapshot.place.region}
                        </Text>
                      ) : null}
                    </View>
                    <GlassButton
                      label={t('common.next')}
                      onPress={() => {
                        setAwaitingPlace(false);
                        goTo(3);
                      }}
                    />
                  </View>
                </Glass>
              ) : awaitingPlace && status === 'loading' ? (
                <View style={styles.locatingRow}>
                  <ActivityIndicator color={theme.tabActive} />
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>
                    {t('ob.locating')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <GlassButton
                  label={t('ob.useLocation')}
                  disabled={locationBusy}
                  onPress={() => void handleUseLocation()}
                />
                <GlassButton
                  label={t('ob.pickCity')}
                  variant="secondary"
                  onPress={() => {
                    setAwaitingPlace(true);
                    setPlaceRequestedAt(Date.now());
                    router.push('/sehir-ara?from=onboarding');
                  }}
                />
              </View>
            </Animated.View>
          ) : null}

          {step === 3 ? (
            <Animated.View key="s3" entering={enterAnim} exiting={exitAnim} style={styles.step}>
              <Text style={[typography.titleM, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                {t('ob.coldTitle')}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {t('ob.coldBody')}
              </Text>
              <View style={styles.coldList}>
                {COLD_OPTIONS.map((option) => {
                  const active = (coldChoice ?? profile.coldSensitivity) === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setColdChoice(option.value);
                        void Haptics.selectionAsync().catch(() => undefined);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        styles.coldRow,
                        {
                          backgroundColor: active
                            ? 'rgba(47,111,237,0.12)'
                            : theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(255,255,255,0.55)',
                          borderColor: active ? theme.primary : 'transparent',
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={[typography.body, { color: theme.text, flex: 1 }]}>
                        {t(option.key)}
                      </Text>
                      {active ? <Check size={18} color={theme.primary} weight="bold" /> : null}
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.actions}>
                <GlassButton label={t('common.next')} onPress={() => goTo(4)} />
              </View>
            </Animated.View>
          ) : null}

          {step === 4 ? (
            <Animated.View key="s4" entering={enterAnim} exiting={exitAnim} style={styles.step}>
              <Text style={[typography.titleM, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                {t('ob.notifTitle')}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {t('ob.notifBody')}
              </Text>
              <Glass>
                <View style={styles.notifRow}>
                  <Text style={[typography.body, { color: theme.text }]}>{t('ob.notifToggle')}</Text>
                  <Switch
                    value={notifOn}
                    onValueChange={(value) => void handleNotifToggle(value)}
                    trackColor={{ false: theme.line, true: theme.primary }}
                    thumbColor={theme.surface}
                    accessibilityLabel={t('ob.notifToggle')}
                  />
                </View>
                {notifOn ? (
                  <>
                    <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('ob.notifTime')}</Text>
                    <TimeWheel
                      hour={notifHour}
                      minute={notifMinute}
                      onChange={(h, m) => {
                        setNotifHour(h);
                        setNotifMinute(m);
                      }}
                    />
                  </>
                ) : null}
              </Glass>
              <View style={styles.actions}>
                <GlassButton label={t('ob.finish')} disabled={busy} onPress={() => void finish(notifOn)} />
                <GlassButton label={t('ob.notNow')} variant="secondary" disabled={busy} onPress={() => void finish(false)} />
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
      </View>

      <SheetModal visible={detailsOpen} onClose={() => setDetailsOpen(false)} title={t('ob.privacyDetailsTitle')}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('ob.privacyDetailsBody')}
          </Text>
        </ScrollView>
      </SheetModal>
    </ScreenBackground>
  );
}

/** Karşılama adımındaki yavaşça yüzen hava ikonu. */
function WelcomeIcon() {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    offset.value = withRepeat(withTiming(10, { duration: 2200 }), -1, true);
  }, [offset, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <Animated.View style={style}>
      <WeatherIcon kind="partly" isDay size={72} color={theme.primary} weight="duotone" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bgLogo: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 240,
    height: 240,
    opacity: 0.07,
  },
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    minWidth: 64,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  step: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  privacyScroll: {
    maxHeight: 220,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    flex: 1,
  },
  detailsLink: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  declinedBox: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_SIZE,
  },
  placeReadyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  placeReadyText: {
    flex: 1,
    gap: 2,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
  },
  coldList: {
    gap: spacing.sm,
  },
  coldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH_SIZE + 8,
  },
});
