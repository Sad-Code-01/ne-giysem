import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { NOTIFICATION_DEFAULTS } from '@/constants/config';
import { nextTriggerDate } from '@/logic/notifications';

/**
 * Yerel günlük hatırlatma servisi.
 * Bildirim her seferinde TEK sefere zamanlanır (sonraki tetik anı); içerik
 * gerçek tahminden üretildiği için uygulama her açılışta/yenilemede yeniden
 * planlanır. Böylece eski veriyle yanlış bilgi gitmez.
 */

let handlerReady = false;

function ensureHandler(): void {
  if (handlerReady) return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_DEFAULTS.channelId, {
    name: 'Günlük kıyafet hatırlatması',
    importance: AndroidImportance.DEFAULT,
  });
}

/** Bildirim iznini ister; verilmişse true döner. */
export async function requestNotificationPermission(): Promise<boolean> {
  ensureHandler();
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Mevcut izin durumunu bildirir (istemeden). */
export async function getNotificationPermission(): Promise<boolean> {
  ensureHandler();
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/** Sonraki tetik anında tek seferlik bildirim planlar. */
export async function scheduleDailyReminder(params: {
  hour: number;
  minute: number;
  title: string;
  body: string;
}): Promise<void> {
  ensureHandler();
  await ensureAndroidChannel();
  await cancelDailyReminder();

  const date = nextTriggerDate(params.hour, params.minute);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_DEFAULTS.identifier,
    content: {
      title: params.title,
      body: params.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: NOTIFICATION_DEFAULTS.channelId,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_DEFAULTS.identifier);
  } catch {
    // Planlanmış bildirim yoksa sorun değil.
  }
}
