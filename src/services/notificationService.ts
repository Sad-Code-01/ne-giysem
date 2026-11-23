import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { NOTIFICATION_DEFAULTS } from '@/constants/config';

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

/**
 * Günlük hatırlatmayı her gün aynı saatte tekrarlar (DAILY trigger).
 * Uygulama kapalıyken de sistem tarafından tetiklenir; içerik planlama
 * anındaki son tahminden üretilir, her açılışta taze içerikle yeniden kurulur.
 */
export async function scheduleDailyReminder(params: {
  hour: number;
  minute: number;
  title: string;
  body: string;
}): Promise<void> {
  ensureHandler();
  await ensureAndroidChannel();
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_DEFAULTS.identifier,
    content: {
      title: params.title,
      body: params.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: params.hour,
      minute: params.minute,
    },
  });
}

const INSTANT_CHANNEL_ID = 'ng-instant-alerts';

async function ensureInstantChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(INSTANT_CHANNEL_ID, {
    name: 'Anlık hava bildirimleri',
    importance: AndroidImportance.HIGH,
  });
}

/** Hava değişimi anında gönderilen tek seferlik bildirim (tekrar etmez). */
export async function sendInstantNotification(title: string, body: string): Promise<void> {
  ensureHandler();
  await ensureInstantChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_DEFAULTS.identifier);
  } catch {
    // Planlanmış bildirim yoksa sorun değil.
  }
}

/** Akşam "Bugün nasıldı?" sorusunun tek seferlik bildirim kimliği. */
const FEEDBACK_PROMPT_ID = 'negiysem:aksam-soru';

/**
 * Geri bildirim sorusunu TEK sefere planlar (DATE trigger). Her uygulama
 * açılışında güncel durumla yeniden kurulur; kullanıcı o gün cevapladıysa
 * planlayan taraf hiç zamanlamaz, cevap anında bekleyen soru iptal edilir.
 */
export async function scheduleFeedbackPrompt(params: {
  date: Date;
  title: string;
  body: string;
}): Promise<void> {
  ensureHandler();
  await ensureAndroidChannel();
  await cancelFeedbackPrompt();
  await Notifications.scheduleNotificationAsync({
    identifier: FEEDBACK_PROMPT_ID,
    content: { title: params.title, body: params.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.date,
    },
  });
}

export async function cancelFeedbackPrompt(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(FEEDBACK_PROMPT_ID);
  } catch {
    // Planlanmış bildirim yoksa sorun değil.
  }
}
