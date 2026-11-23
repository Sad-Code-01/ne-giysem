import { useEffect } from 'react';

import {
  FEEDBACK_PROMPT_INTERVAL_MS,
  NOTIFICATION_MAX_DATA_AGE_MS,
} from '@/constants/config';
import {
  feedbackPromptContent,
  feedbackPromptTime,
  localDateKey,
  nextTriggerDate,
  reminderContent,
} from '@/logic/notifications';
import { useProfile } from '@/hooks/useProfile';
import {
  cancelDailyReminder,
  cancelFeedbackPrompt,
  getNotificationPermission,
  scheduleDailyReminder,
  scheduleFeedbackPrompt,
} from '@/services/notificationService';
import { getFeedbackFor, getLastFeedbackPromptAt, setLastFeedbackPromptAt } from '@/storage/feedback';
import type { WeatherSnapshot } from '@/types';

/**
 * Profil + hava verisi değiştikçe günlük hatırlatmayı yeniden planlar.
 * Veri 24 saatten eskiyse ya da hatırlatma kapalıysa iptal eder —
 * eski veriyle yanlış bilgi gönderilmez.
 *
 * Ayrıca akşam "Bugün nasıldı?" sorusunu (roadmap §5.2) günde en fazla
 * bir kez planlar: hedef gün için geri bildirim zaten kayıtlıysa o gün
 * sorulmaz, izin yoksa hiçbir şey zamanlanmaz.
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
        await Promise.all([cancelDailyReminder(), cancelFeedbackPrompt()]);
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

      // Akşam geri bildirim sorusu: tek seferlik, izin varsa ve o gün
      // için cevap yoksa. Cevaplanmışsa bir sonraki güne kayar.
      const permitted = await getNotificationPermission();
      if (cancelled || !permitted) {
        await cancelFeedbackPrompt();
        return;
      }
      // Sıklık sınırı: son sorudan bu yana 3 gün geçmediyse sorma.
      const lastPromptAt = await getLastFeedbackPromptAt();
      if (Date.now() - lastPromptAt < FEEDBACK_PROMPT_INTERVAL_MS) {
        await cancelFeedbackPrompt();
        return;
      }
      const { hour: pHour, minute: pMinute } = feedbackPromptTime(notifHour, notifMinute);
      let target = nextTriggerDate(pHour, pMinute);
      if (await getFeedbackFor(localDateKey(target))) {
        target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
      }
      const prompt = feedbackPromptContent();
      await scheduleFeedbackPrompt({ date: target, title: prompt.title, body: prompt.body });
      await setLastFeedbackPromptAt(Date.now());
    })();

    return () => {
      cancelled = true;
    };
  }, [snapshot, outfitProfile, notifEnabled, notifHour, notifMinute]);
}
