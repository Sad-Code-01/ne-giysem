import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { LockSimple } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, GlassButton, ScreenBackground } from '@/components/glass';
import { SettingsHeader } from '@/components/SettingsHeader';
import { TimeWheel } from '@/components/TimeWheel';
import { useProfile } from '@/hooks/useProfile';
import { nextTriggerDate } from '@/logic/notifications';
import { getNotificationPermission, requestNotificationPermission } from '@/services/notificationService';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { MIN_TOUCH_SIZE, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { NotificationPeriod } from '@/storage/profileStore';

/** Hatırlatma dönemi: sabah → bugünün, akşam → yarının kombini. Saat 12'den önceyse sabah sayılır. */
function periodForHour(hour: number): NotificationPeriod {
  return hour < 12 ? 'sabah' : 'aksam';
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Bildirim ayarları: aç/kapa, 24 saat wheel ile saat+dakika, test bildirimi. */
export default function NotificationSettingsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile, setNotifEnabled, setNotifSchedule } = useProfile();
  const [denied, setDenied] = useState(false);
  // Kullanıcı tekerleği oynatınca taslak oluşur; "Tamam" ile kaydedilir.
  const [draft, setDraft] = useState<{ hour: number; minute: number } | null>(null);
  const shownHour = draft?.hour ?? profile.notifHour;
  const shownMinute = draft?.minute ?? profile.notifMinute;

  const handleToggle = async (value: boolean): Promise<void> => {
    if (value) {
      // İzin henüz yoksa sistem diyaloğundan önce kısa açıklama göster.
      if (!(await getNotificationPermission())) {
        const approved = await new Promise<boolean>((resolve) => {
          Alert.alert(t('settings.notifPermTitle'), t('settings.notifPermBody'), [
            { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('common.allow'), onPress: () => resolve(true) },
          ]);
        });
        if (!approved) return;
      }
      const granted = await requestNotificationPermission();
      if (!granted) {
        setDenied(true);
        return;
      }
      setDenied(false);
    } else {
      // Açık durumdayken kapatma yanlışlıkla olmasın diye onay iste.
      const approved = await new Promise<boolean>((resolve) => {
        Alert.alert(t('settings.notifOffTitle'), t('settings.notifOffBody'), [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('settings.notifOffConfirm'), style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!approved) return;
    }
    await setNotifEnabled(value);
  };

  const handleTimeChange = (hour: number, minute: number): void => {
    setDraft({ hour, minute });
  };

  const handleTimeConfirm = (): void => {
    if (!draft) return;
    void setNotifSchedule(periodForHour(draft.hour), draft.hour, draft.minute).then(() =>
      setDraft(null)
    );
  };

  const nextAt = nextTriggerDate(profile.notifHour, profile.notifMinute);
  const nextLabel = `${pad2(nextAt.getDate())}.${pad2(nextAt.getMonth() + 1)} ${pad2(nextAt.getHours())}:${pad2(nextAt.getMinutes())}`;

  return (
    <ScreenBackground kind="partly">
      <SettingsHeader title={t('settings.notifTitle')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.notifSubtitle')}
        </Text>

        <Glass>
          <View style={styles.row}>
            <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{t('ob.notifToggle')}</Text>
            {profile.notifEnabled ? (
              <LockSimple size={16} color={theme.textSecondary} />
            ) : null}
            <Switch
              value={profile.notifEnabled}
              onValueChange={(value) => void handleToggle(value)}
              trackColor={{ false: theme.line, true: theme.primary }}
              thumbColor={theme.surface}
              accessibilityLabel={t('ob.notifToggle')}
            />
          </View>

          {profile.notifEnabled ? (
            <>
              <View style={styles.divider} />
              <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('ob.notifTime')}</Text>
              <TimeWheel hour={shownHour} minute={shownMinute} onChange={handleTimeChange} />
              <GlassButton
                label={t('common.done')}
                onPress={handleTimeConfirm}
                disabled={draft === null}
              />
              <Text style={[typography.micro, { color: theme.textSecondary }]}>
                {t('settings.notifNext', { time: nextLabel })}
              </Text>
            </>
          ) : null}
        </Glass>

        {denied ? (
          <Text style={[typography.caption, { color: theme.text }]}>{t('settings.notifDenied')}</Text>
        ) : null}
        <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.notifNote')}
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(127,140,160,0.25)',
  },
});
