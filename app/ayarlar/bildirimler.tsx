import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/components/SegmentedControl';
import { Screen } from '@/components/Screen';
import { SettingsHeader } from '@/components/SettingsHeader';
import { useProfile } from '@/hooks/useProfile';
import { requestNotificationPermission } from '@/services/notificationService';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, MIN_TOUCH_SIZE, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { NotificationPeriod } from '@/storage/profileStore';

/** Bildirim ayarları: aç/kapa, sabah/akşam, saat. */
export default function NotificationSettingsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile, setNotifEnabled, setNotifSchedule } = useProfile();
  const [denied, setDenied] = useState(false);

  const handleToggle = async (value: boolean): Promise<void> => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setDenied(true);
        return;
      }
      setDenied(false);
    }
    await setNotifEnabled(value);
  };

  return (
    <Screen>
      <SettingsHeader title={t('settings.notifTitle')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.notifSubtitle')}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={styles.row}>
            <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{t('ob.notifToggle')}</Text>
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
              <SegmentedControl
                options={[
                  { value: 'sabah' as NotificationPeriod, label: t('notif.periodMorning') },
                  { value: 'aksam' as NotificationPeriod, label: t('notif.periodEvening') },
                ]}
                value={profile.notifPeriod}
                onChange={(period) => void setNotifSchedule(period, profile.notifHour, profile.notifMinute)}
              />
              <View style={styles.timeRow}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('ob.notifTime')}</Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() =>
                      void setNotifSchedule(
                        profile.notifPeriod,
                        (profile.notifHour + 23) % 24,
                        profile.notifMinute
                      )
                    }
                    accessibilityRole="button"
                    style={[styles.stepperButton, { borderColor: theme.line }]}
                  >
                    <Text style={[typography.titleS, { color: theme.text }]}>−</Text>
                  </Pressable>
                  <Text style={[typography.titleS, { color: theme.text }]}>
                    {`${String(profile.notifHour).padStart(2, '0')}:${String(profile.notifMinute).padStart(2, '0')}`}
                  </Text>
                  <Pressable
                    onPress={() =>
                      void setNotifSchedule(
                        profile.notifPeriod,
                        (profile.notifHour + 1) % 24,
                        profile.notifMinute
                      )
                    }
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

        {denied ? (
          <Text style={[typography.caption, { color: theme.text }]}>{t('settings.notifDenied')}</Text>
        ) : null}
        <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.notifNote')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
