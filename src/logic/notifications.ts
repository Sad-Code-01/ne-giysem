import { buildDayOutfit } from '@/logic/outfitEngine';
import { garmentLabel } from '@/logic/garmentCatalog';
import { t } from '@/i18n';
import type { OutfitProfile, WeatherSnapshot } from '@/types';
import type { NotificationPeriod } from '@/storage/profileStore';

/**
 * Günlük hatırlatma için saf yardımcılar.
 * - `nextTriggerDate`: bir sonraki tetik anını hesaplar (yerel saat).
 * - `reminderContent`: gerçek tahminden bildirim metni üretir; uydurma veri yok.
 */

/** `hour:minute`'in `from`'dan sonraki ilk oluşumu. */
export function nextTriggerDate(hour: number, minute: number, from: Date = new Date()): Date {
  const date = new Date(from.getTime());
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= from.getTime()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

/**
 * Hatırlatma gövdesi: akşam → yarının, sabah → bugünün kombini.
 * `buildDayOutfit` çıktısı kullanılır; tahmin yoksa çağıran planlamaz.
 * Gövde, günün dilimlerinin (sabah/öğle/akşam) öneri ve hissedilen
 * sıcaklığını tek bildirimde özetler.
 */
export function reminderContent(
  snapshot: WeatherSnapshot,
  profile: OutfitProfile,
  period: NotificationPeriod
): { title: string; body: string } {
  const dayOffset = period === 'aksam' ? 1 : 0;
  const day = buildDayOutfit(snapshot, profile, dayOffset);
  const label = period === 'aksam' ? t('notif.tomorrow') : t('notif.today');

  const slotLines = (day.slots ?? []).map((slot) => {
    const slotLabel = t(`slot.${slot.slot}` as const);
    const feels = Math.round(slot.effectiveTemp);
    return `${slotLabel} ${feels}° · ${garmentLabel(slot.hero)}`;
  });

  const body = slotLines.length
    ? `${label}: ${day.title}\n${slotLines.join('\n')}`
    : `${label}: ${day.title}`;

  return {
    title: t('notif.title'),
    body,
  };
}

/** Date → "YYYY-MM-DD" (yerel saat). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Akşam "Bugün nasıldı?" sorusu için saat (roadmap §5.2).
 * Akşam hatırlatması varsa ondan ~1 saat sonra; sabahçıysa 20:00.
 * Asla gece yarısını geçmeyecek şekilde 23:00'te sınırlanır.
 */
export function feedbackPromptTime(notifHour: number, notifMinute: number): { hour: number; minute: number } {
  if (notifHour >= 12) {
    return { hour: Math.min(notifHour + 1, 23), minute: notifMinute };
  }
  return { hour: 20, minute: 0 };
}

/** Geri bildirim sorusu bildirimi içeriği. */
export function feedbackPromptContent(): { title: string; body: string } {
  return {
    title: t('feedback.ask'),
    body: t('notif.feedbackBody'),
  };
}
