import AsyncStorage from '@react-native-async-storage/async-storage';

import { detectInstantAlerts, type InstantAlertKind } from '@/logic/instantAlerts';
import { t } from '@/i18n';
import { getStoredProfile, toOutfitProfile } from '@/storage/profileStore';
import { getNotificationPermission, sendInstantNotification } from '@/services/notificationService';
import type { WeatherSnapshot } from '@/types';

/**
 * Anlık bildirim gönderimi: profil açık + bildirim izni varsa çalışır.
 * Aynı gün aynı tür için tek sefer — `ng_instant_sent` deposunda tutulur.
 */
const SENT_KEY = 'ng_instant_sent_v1';
const KEEP_MS = 3 * 24 * 60 * 60 * 1000;

const TITLES: Record<InstantAlertKind, string> = {
  storm: 'alert.stormTitle',
  rain: 'alert.rainTitle',
  cold: 'alert.coldTitle',
};
const BODIES: Record<InstantAlertKind, string> = {
  storm: 'alert.stormBody',
  rain: 'alert.rainBody',
  cold: 'alert.coldBody',
};

async function alreadySent(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SENT_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, number>;
    const at = map[key];
    return typeof at === 'number' && Date.now() - at < KEEP_MS;
  } catch {
    return false;
  }
}

async function markSent(key: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SENT_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    map[key] = Date.now();
    const cutoff = Date.now() - KEEP_MS;
    for (const k of Object.keys(map)) {
      if (map[k] < cutoff) delete map[k];
    }
    await AsyncStorage.setItem(SENT_KEY, JSON.stringify(map));
  } catch {
    // sessiz
  }
}

/** Hava yenilemesi sonrası çağrılır; uygun olayları tek seferlik bildirir. */
export async function maybeSendInstantAlerts(
  prev: WeatherSnapshot | null,
  next: WeatherSnapshot
): Promise<void> {
  try {
    if (!prev) return;
    const profile = await getStoredProfile();
    if (!profile.instantAlerts) return;
    if (!(await getNotificationPermission())) return;

    const alerts = detectInstantAlerts(prev, next, toOutfitProfile(profile));
    for (const alert of alerts) {
      if (await alreadySent(alert.key)) continue;
      await sendInstantNotification(t(TITLES[alert.kind]), t(BODIES[alert.kind]));
      await markSent(alert.key);
    }
  } catch {
    // Anlık bildirim kritik değil — hata kullanıcıyı etkilemesin.
  }
}
