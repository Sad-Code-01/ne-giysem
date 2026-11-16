import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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

import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SheetModal } from '@/components/SheetModal';
import { SolidButton } from '@/components/SolidButton';
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

const STEP_COUNT = 4;

function progressLabel(step: number): string {
  return `${step + 1}/${STEP_COUNT}`;
}

/** Karşılama akışı: karşılama → gizlilik onayı → konum → bildirim. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { status, start: startWeather, loadMyLocation } = useWeatherContext();
  const { setNotifEnabled, setNotifSchedule } = useProfile();

  const [step, setStep] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [awaitingPlace, setAwaitingPlace] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [notifPeriod, setNotifPeriod] = useState<NotificationPeriod>('aksam');
  const [notifHour, setNotifHour] = useState(21);
  const [busy, setBusy] = useState(false);

  const goTo = (next: number): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setStep(next);
  };

  // Konum adımında kullanıcı konum/şehir seçimini başlattıysa ve veri
  // hazırsa bildirim adımına geç; hata olursa kullanıcıya göster.
  // (Geri dönülüp tekrar denenebilir — otomatik geçiş yalnızca istek varken.)
  useEffect(() => {
    if (step !== 2 || !awaitingPlace) return;
    // Dış durum (hava akışı) değişimine yanıt; durumu bir sonraki tikte güncelle.
    const timer = setTimeout(() => {
      if (status === 'ready') {
        setAwaitingPlace(false);
        goTo(3);
      } else if (status === 'error') {
        setAwaitingPlace(false);
        setLocationFailed(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [status, step, awaitingPlace]);

  const handleUseLocation = async (): Promise<void> => {
    if (locationBusy) return;
    setLocationBusy(true);
    setLocationFailed(false);
    setAwaitingPlace(true);
    try {
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
      if (enableNotif && notifOn) {
        await setNotifSchedule(notifPeriod, notifHour, 0);
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
    ? FadeIn.duration(200)
    : SlideInRight.springify().damping(22).stiffness(220);
  const exitAnim = reduceMotion ? FadeOut.duration(150) : SlideOutLeft.duration(200);

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
    <Screen>
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
                <SolidButton label={t('ob.start')} onPress={() => goTo(1)} />
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
                  <SolidButton label={t('common.back')} variant="secondary" onPress={() => { setDeclined(false); goTo(0); }} />
                </View>
              ) : (
                <View style={styles.actions}>
                  <SolidButton
                    label={t('common.next')}
                    disabled={!consentChecked}
                    onPress={() => {
                      void acceptConsent();
                      goTo(2);
                    }}
                  />
                  <SolidButton
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
              {locationFailed || status === 'error' ? (
                <Text style={[typography.caption, { color: theme.text }]}>{t('error.location')}</Text>
              ) : null}
              <View style={styles.actions}>
                <SolidButton
                  label={t('ob.useLocation')}
                  disabled={locationBusy}
                  onPress={() => void handleUseLocation()}
                />
                <SolidButton
                  label={t('ob.pickCity')}
                  variant="secondary"
                  onPress={() => {
                    setAwaitingPlace(true);
                    router.push('/sehir-ara');
                  }}
                />
                <Pressable onPress={() => void finish(false)} style={styles.skip} accessibilityRole="button">
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('ob.skipForNow')}</Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {step === 3 ? (
            <Animated.View key="s3" entering={enterAnim} exiting={exitAnim} style={styles.step}>
              <Text style={[typography.titleM, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
                {t('ob.notifTitle')}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {t('ob.notifBody')}
              </Text>
              <View style={[styles.notifCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
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
                    <SegmentedControl
                      options={[
                        { value: 'sabah' as NotificationPeriod, label: t('notif.periodMorning') },
                        { value: 'aksam' as NotificationPeriod, label: t('notif.periodEvening') },
                      ]}
                      value={notifPeriod}
                      onChange={setNotifPeriod}
                    />
                    <View style={styles.timeRow}>
                      <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('ob.notifTime')}</Text>
                      <View style={styles.stepper}>
                        <Pressable
                          onPress={() => setNotifHour((h) => (h + 23) % 24)}
                          accessibilityRole="button"
                          style={[styles.stepperButton, { borderColor: theme.line }]}
                        >
                          <Text style={[typography.titleS, { color: theme.text }]}>−</Text>
                        </Pressable>
                        <Text style={[typography.titleS, { color: theme.text }]}>
                          {`${String(notifHour).padStart(2, '0')}:00`}
                        </Text>
                        <Pressable
                          onPress={() => setNotifHour((h) => (h + 1) % 24)}
                          accessibilityRole="button"
                          style={[styles.stepperButton, { borderColor: theme.line }]}
                        >
                          <Text style={[typography.titleS, { color: theme.text }]}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
              <View style={styles.actions}>
                <SolidButton label={t('ob.finish')} disabled={busy} onPress={() => void finish(notifOn)} />
                <SolidButton label={t('ob.notNow')} variant="secondary" disabled={busy} onPress={() => void finish(false)} />
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
    </Screen>
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
  skip: {
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCard: {
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    padding: spacing.lg,
    gap: spacing.md,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_SIZE,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
