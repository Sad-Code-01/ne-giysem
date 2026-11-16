import { buildDayOutfit } from '@/logic/outfitEngine';
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
 */
export function reminderContent(
  snapshot: WeatherSnapshot,
  profile: OutfitProfile,
  period: NotificationPeriod
): { title: string; body: string } {
  const dayOffset = period === 'aksam' ? 1 : 0;
  const day = buildDayOutfit(snapshot, profile, dayOffset);
  const label = period === 'aksam' ? t('notif.tomorrow') : t('notif.today');
  return {
    title: t('notif.title'),
    body: `${label}: ${day.title}`,
  };
}
