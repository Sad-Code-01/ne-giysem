import { useEffect } from 'react';

import { NOTIFICATION_MAX_DATA_AGE_MS } from '@/constants/config';
import { reminderContent } from '@/logic/notifications';
import { useProfile } from '@/hooks/useProfile';
import { cancelDailyReminder, scheduleDailyReminder } from '@/services/notificationService';
import type { WeatherSnapshot } from '@/types';

/**
 * Profil + hava verisi değiştikçe günlük hatırlatmayı yeniden planlar.
 * Veri 24 saatten eskiyse ya da hatırlatma kapalıysa iptal eder —
 * eski veriyle yanlış bilgi gönderilmez.
 */
export function useDailyReminder(snapshot: WeatherSnapshot | null): void {
  const { profile, outfitProfile } = useProfile();
  const { notifEnabled, notifHour, notifMinute } = profile;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stale =
        !snapshot || Date.now() - snapshot.fetchedAt > NOTIFICATION_MAX_DATA_AGE_MS;
      if (!notifEnabled || stale) {
        await cancelDailyReminder();
        return;
      }
      if (cancelled) return;

      // 24 saat seçimi: 12'den önce → bugünün kombini, sonra → yarınınki.
      const period = notifHour < 12 ? 'sabah' : 'aksam';
      const { title, body } = reminderContent(snapshot, outfitProfile, period);
      await scheduleDailyReminder({
        hour: notifHour,
        minute: notifMinute,
        title,
        body,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [snapshot, outfitProfile, notifEnabled, notifHour, notifMinute]);
}
