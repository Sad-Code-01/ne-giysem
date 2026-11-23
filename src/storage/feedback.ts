import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OutfitFeedback } from '@/logic/feedback';

/**
 * Gün başına tek geri bildirim kaydı (roadmap §5.1: aynı gün/öneri için
 * anket tekrarlanmaz). Anahtar: günün ISO tarih anahtarı (YYYY-MM-DD).
 */
const STORAGE_KEY = 'ng_feedback_v1';
/** Son geri bildirim sorusunun (bildirim veya uygulama içi) zaman damgası. */
const PROMPT_KEY = 'ng_feedback_prompt_v1';
/** Saklanan kayıtların üst sınırı — eski günler budanır. */
const KEEP_DAYS = 30;

type FeedbackMap = Record<string, OutfitFeedback>;

async function readMap(): Promise<FeedbackMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as FeedbackMap;
    }
  } catch {
    // bozuk kayıt → sıfırdan başla
  }
  return {};
}

/** Bu gün için kayıtlı geri bildirim (yoksa null). */
export async function getFeedbackFor(dateKey: string): Promise<OutfitFeedback | null> {
  const map = await readMap();
  return map[dateKey] ?? null;
}

/** Geri bildirimi kaydeder; 30 günden eski kayıtları budar. */
export async function recordFeedback(dateKey: string, value: OutfitFeedback): Promise<void> {
  const map = await readMap();
  map[dateKey] = value;
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const key of Object.keys(map)) {
    const time = Date.parse(`${key}T00:00:00Z`);
    if (Number.isFinite(time) && time < cutoff) delete map[key];
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // depolama hatası sessizce yutulur — geri bildirim kritik değil
  }
}

/** Son sorunun epoch ms'i; hiç sorulmadıysa 0. */
export async function getLastFeedbackPromptAt(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(PROMPT_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Sorunun sorulduğu anı kaydeder — 3 günlük sıklık sınırı bununla işler. */
export async function setLastFeedbackPromptAt(epochMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(PROMPT_KEY, String(epochMs));
  } catch {
    // yutulur
  }
}
