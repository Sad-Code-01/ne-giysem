import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  Bell,
  CaretRight,
  DeviceMobile,
  Info,
  MapPin,
  ShieldCheck,
  Thermometer,
  type Icon,
} from 'phosphor-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { Glass, GlassButton, IconBadge, ScreenBackground } from '@/components/glass';
import { SheetModal } from '@/components/SheetModal';
import { useProfile } from '@/hooks/useProfile';
import { useTabFade } from '@/hooks/useTabFade';
import { t } from '@/i18n';
import { onScrollToTopRequest } from '@/lib/scrollToTop';
import { pushWidgetUpdate } from '@/widgets/resolveWidgetData';
import { WidgetHelpSheet } from '@/components/WidgetHelpSheet';
import { cancelDailyReminder } from '@/services/notificationService';
import { clearConsent } from '@/storage/consent';
import { clearLastSnapshot, setOnboardingDone, setSelectedPlace } from '@/storage/cache';
import { useAppTheme } from '@/theme/useAppTheme';
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
  const { resetProfile } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [widgetHelpOpen, setWidgetHelpOpen] = useState(false);
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
    <ScreenBackground kind="partly" isDay={!theme.isDark}>
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
          </Glass>

          <SectionTitle>{t('settings.sectionApp')}</SectionTitle>
          <Glass padded={false} contentStyle={styles.group}>
            <SettingsRow icon={Bell} label={t('settings.notifTitle')} onPress={() => router.push('/ayarlar/bildirimler')} />
            <View style={styles.hairline} />
            <SettingsRow icon={MapPin} label={t('settings.citiesTitle')} onPress={() => router.push('/ayarlar/konumlar')} />
            <View style={styles.hairline} />
            <SettingsRow icon={DeviceMobile} label={t('settings.widgetAdd')} onPress={() => setWidgetHelpOpen(true)} />
          </Glass>

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
              onPress={() => void WebBrowser.openBrowserAsync('https://open-meteo.com')}
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

      <WidgetHelpSheet visible={widgetHelpOpen} onClose={() => setWidgetHelpOpen(false)} />

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
