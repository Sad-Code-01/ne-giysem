import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  Bell,
  CaretRight,
  CircleHalf,
  DeviceMobile,
  CoatHanger,
  Info,
  MapPin,
  ShieldCheck,
  Thermometer,
  type Icon,
} from 'phosphor-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import {
  OFFICIAL_SOURCES,
  mgmIlUrl,
  toMgmIlKey,
  type OfficialSource,
} from '@/constants/officialSources';
import { Glass, GlassButton, GlassSegmented, IconBadge, ScreenBackground } from '@/components/glass';
import { SheetModal } from '@/components/SheetModal';
import { useProfile } from '@/hooks/useProfile';
import { useTabFade } from '@/hooks/useTabFade';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { t } from '@/i18n';
import { onScrollToTopRequest } from '@/lib/scrollToTop';
import { pushWidgetUpdate } from '@/widgets/resolveWidgetData';
import { cancelDailyReminder } from '@/services/notificationService';
import { clearConsent } from '@/storage/consent';
import { clearLastSnapshot, setOnboardingDone, setSelectedPlace } from '@/storage/cache';
import { useAppTheme } from '@/theme/useAppTheme';
import { getThemeMode, setThemeMode, type ThemeMode } from '@/theme/themeMode';
import { MIN_TOUCH_SIZE, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function SettingsRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <IconBadge icon={icon} size={20} boxSize={40} color={danger ? theme.textSecondary : theme.tabActive} />
      <Text
        style={[typography.body, { color: theme.text, flex: 1 }]}
        numberOfLines={2}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
      <CaretRight size={18} color={theme.textSecondary} weight="regular" />
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  const theme = useAppTheme();
  return (
    <Text style={[typography.caption, { color: theme.textSecondary }]}>{children}</Text>
  );
}

/** Ayarlar sekmesi: üşüme, bildirim, konumlar, gizlilik, hakkında. */
export default function SettingsTabScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, resetProfile } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode);
  const fadeStyle = useTabFade();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(
    () =>
      onScrollToTopRequest('ayarlar', () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }),
    []
  );

  const version = Constants.expoConfig?.version ?? '—';
  const build = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode;
  const { snapshot } = useWeatherContext();
  // MGM il sayfası seçili konumun iline otomatik bağlanır.
  const placeRegion = snapshot?.place.region || snapshot?.place.name || '';
  const ilKey = placeRegion ? toMgmIlKey(placeRegion) : '';
  // Uyarı kaynakları şimdilik yalnızca Türkiye için; ülke bilinmiyorsa
  // (ör. bazı GPS sonuçları) panel yine de gösterilir.
  const placeCountry = snapshot?.place.country ?? '';
  const isTurkey = !placeCountry || /turkey|t[uü]rkiye/i.test(placeCountry);
  const alertSources: OfficialSource[] = ilKey
    ? [
        {
          id: 'mgm-il',
          name: 'Meteoroloji (MGM)',
          description: `${placeRegion} il ve ilçe uyarıları`,
          url: mgmIlUrl(ilKey),
        },
        ...OFFICIAL_SOURCES,
      ]
    : [...OFFICIAL_SOURCES];

  /** Dış bağlantı öncesi kısa onay: resmî kaynak olduğunu ve tarayıcıya çıkılacağını belirtir. */
  const confirmOpenLink = (url: string): void => {
    let host = url;
    try {
      host = new URL(url).host;
    } catch {
      // url olduğu gibi gösterilir
    }
    Alert.alert(t('links.externalTitle'), t('links.externalBody', { host }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.open'), onPress: () => void WebBrowser.openBrowserAsync(url) },
    ]);
  };

  const withdraw = async (): Promise<void> => {
    if (withdrawing) return;
    setWithdrawing(true);
    try {
      await cancelDailyReminder();
      await clearConsent();
      await setOnboardingDone(false);
      await setSelectedPlace(null);
      await clearLastSnapshot();
      await resetProfile();
      void pushWidgetUpdate();
      setConfirmOpen(false);
      router.replace('/karsilama');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <ScreenBackground kind="partly">
      <Animated.View style={[styles.flex, fadeStyle]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={[typography.titleL, { color: theme.text }]}>{t('settings.title')}</Text>
          </Animated.View>

          <SectionTitle>{t('settings.sectionYou')}</SectionTitle>
          <Glass padded={false} contentStyle={styles.group}>
            <SettingsRow icon={Thermometer} label={t('settings.feelTitle')} onPress={() => router.push('/ayarlar/usume')} />
            <View style={styles.hairline} />
            <SettingsRow icon={Info} label={t('info.title')} onPress={() => router.push('/ayarlar/bilgi')} />
          </Glass>

          <SectionTitle>{t('settings.sectionApp')}</SectionTitle>
          <Glass padded={false} contentStyle={styles.group}>
            <SettingsRow icon={CircleHalf} label={t('settings.themeTitle')} onPress={() => setThemeSheetOpen(true)} />
            <View style={styles.hairline} />
            <SettingsRow icon={Bell} label={t('settings.notifTitle')} onPress={() => router.push('/ayarlar/bildirimler')} />
            <View style={styles.hairline} />
            <SettingsRow icon={MapPin} label={t('settings.citiesTitle')} onPress={() => router.push('/ayarlar/konumlar')} />
            <SettingsRow icon={CoatHanger} label={t('wardrobe.title')} onPress={() => router.push('/ayarlar/dolap')} />
            <View style={styles.hairline} />
            <SettingsRow icon={DeviceMobile} label={t('settings.widgetAdd')} onPress={() => router.push('/ayarlar/widgetler')} />
          </Glass>
          {!profile.notifEnabled ? (
            <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {t('settings.notifOffHint')}
            </Text>
          ) : null}

          <SectionTitle>{t('settings.sectionAlerts')}</SectionTitle>
          {!isTurkey ? (
            <Glass contentStyle={styles.aboutCard}>
              <View style={styles.aboutRow}>
                <Bell size={18} color={theme.textSecondary} weight="regular" />
                <Text style={[typography.caption, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                  {t('settings.alertsNotAvailable')}
                </Text>
              </View>
            </Glass>
          ) : (
          <Glass padded={false} contentStyle={styles.group}>
            {alertSources.map((source, index) => (
              <View key={source.id}>
                {index > 0 ? <View style={styles.hairline} /> : null}
                <Pressable
                  onPress={() => confirmOpenLink(source.url)}
                  accessibilityRole="link"
                  accessibilityLabel={`${source.name} — ${source.description}`}
                  style={({ pressed }) => [styles.sourceRow, pressed && styles.rowPressed]}
                >
                  <IconBadge icon={Bell} size={20} boxSize={40} />
                  <View style={styles.sourceText}>
                    <Text style={[typography.body, { color: theme.text }]} numberOfLines={1}>
                      {source.name}
                    </Text>
                    <Text style={[typography.micro, { color: theme.textSecondary }]} numberOfLines={1}>
                      {source.description}
                    </Text>
                  </View>
                  <CaretRight size={18} color={theme.textSecondary} weight="regular" />
                </Pressable>
              </View>
            ))}
          </Glass>
          )}

          <SectionTitle>{t('settings.sectionPrivacy')}</SectionTitle>
          <Glass padded={false} contentStyle={styles.group}>
            <SettingsRow icon={ShieldCheck} label={t('settings.withdraw')} danger onPress={() => setConfirmOpen(true)} />
          </Glass>

          <SectionTitle>{t('settings.sectionAbout')}</SectionTitle>
          <Glass contentStyle={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Info size={18} color={theme.textSecondary} weight="regular" />
              <Text style={[typography.caption, { color: theme.textSecondary }]}>
                {t('settings.version', { version, build: build ?? '—' })}
              </Text>
            </View>
            <Pressable
              onPress={() => confirmOpenLink('https://open-meteo.com')}
              accessibilityRole="link"
              style={styles.aboutLink}
            >
              <Text style={[typography.caption, { color: theme.tabActive }]}>{t('settings.dataSource')}</Text>
            </Pressable>
            <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {t('settings.notOfficial')}
            </Text>
          </Glass>
        </ScrollView>
      </Animated.View>


      <SheetModal
        visible={themeSheetOpen}
        onClose={() => setThemeSheetOpen(false)}
        title={t('settings.themeSheetTitle')}
      >
        <GlassSegmented
          options={[
            { value: 'system' as ThemeMode, label: t('settings.themeSystem') },
            { value: 'light' as ThemeMode, label: t('settings.themeLight') },
            { value: 'dark' as ThemeMode, label: t('settings.themeDark') },
          ]}
          value={themeMode}
          onChange={(value) => {
            setThemeModeState(value);
            void setThemeMode(value);
          }}
        />
        <GlassButton
          label={t('common.close')}
          variant="secondary"
          onPress={() => setThemeSheetOpen(false)}
        />
      </SheetModal>

      <SheetModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} title={t('settings.withdrawTitle')}>
        <View style={styles.sheetBody}>
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('settings.withdrawBody')}
          </Text>
          <View style={styles.sheetActions}>
            <GlassButton
              label={t('settings.withdrawConfirm')}
              disabled={withdrawing}
              onPress={() => void withdraw()}
            />
            <GlassButton
              label={t('common.cancel')}
              variant="secondary"
              onPress={() => setConfirmOpen(false)}
            />
          </View>
        </View>
      </SheetModal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  group: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_SIZE + 8,
  },
  rowPressed: {
    opacity: 0.7,
  },
  hairline: {
    height: 1,
    backgroundColor: 'rgba(120,140,165,0.25)',
    marginLeft: 52,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_SIZE + 8,
  },
  sourceText: {
    flex: 1,
    gap: 2,
  },
  aboutCard: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aboutLink: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  sheetBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  sheetActions: {
    gap: spacing.sm,
  },
});
