import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Bell, CaretRight, MapPin, ShieldCheck, Thermometer, Info } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { Screen } from '@/components/Screen';
import { SheetModal } from '@/components/SheetModal';
import { SolidButton } from '@/components/SolidButton';
import { useProfile } from '@/hooks/useProfile';
import { t } from '@/i18n';
import { cancelDailyReminder } from '@/services/notificationService';
import { clearConsent } from '@/storage/consent';
import { clearLastSnapshot, setOnboardingDone, setSelectedPlace } from '@/storage/cache';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function SettingsRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
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
      style={[styles.row, { borderColor: theme.line, backgroundColor: theme.surface }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? theme.surface : theme.primary }]}>
        {icon}
      </View>
      <Text
        style={[typography.body, { color: danger ? theme.text : theme.text, flex: 1 }]}
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
      setConfirmOpen(false);
      router.replace('/karsilama');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.titleL, { color: theme.text }]}>{t('settings.title')}</Text>

        <SectionTitle>{t('settings.sectionYou')}</SectionTitle>
        <SettingsRow
          icon={<Thermometer size={20} color={theme.onPrimary} weight="regular" />}
          label={t('settings.feelTitle')}
          onPress={() => router.push('/ayarlar/usume')}
        />

        <SectionTitle>{t('settings.sectionApp')}</SectionTitle>
        <SettingsRow
          icon={<Bell size={20} color={theme.onPrimary} weight="regular" />}
          label={t('settings.notifTitle')}
          onPress={() => router.push('/ayarlar/bildirimler')}
        />
        <SettingsRow
          icon={<MapPin size={20} color={theme.onPrimary} weight="regular" />}
          label={t('settings.citiesTitle')}
          onPress={() => router.push('/ayarlar/konumlar')}
        />

        <SectionTitle>{t('settings.sectionPrivacy')}</SectionTitle>
        <SettingsRow
          icon={<ShieldCheck size={20} color={theme.text} weight="regular" />}
          label={t('settings.withdraw')}
          danger
          onPress={() => setConfirmOpen(true)}
        />

        <SectionTitle>{t('settings.sectionAbout')}</SectionTitle>
        <View style={[styles.aboutCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
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
            <Text style={[typography.caption, { color: theme.primary }]}>{t('settings.dataSource')}</Text>
          </Pressable>
          <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('settings.notOfficial')}
          </Text>
        </View>
      </ScrollView>

      <SheetModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} title={t('settings.withdrawTitle')}>
        <View style={styles.sheetBody}>
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('settings.withdrawBody')}
          </Text>
          <View style={styles.sheetActions}>
            <SolidButton
              label={t('settings.withdrawConfirm')}
              disabled={withdrawing}
              onPress={() => void withdraw()}
            />
            <SolidButton
              label={t('common.cancel')}
              variant="secondary"
              onPress={() => setConfirmOpen(false)}
            />
          </View>
        </View>
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    padding: spacing.lg,
    minHeight: 64,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCard: {
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aboutLink: {
    minHeight: 44,
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
