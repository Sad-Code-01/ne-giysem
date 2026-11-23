import AsyncStorage from '@react-native-async-storage/async-storage';

import { NOTIFICATION_DEFAULTS, OUTFIT_THRESHOLDS } from '@/constants/config';
import type { ColdSensitivity, OutfitProfile, Place } from '@/types';

/**
 * Profil deposu: üşüme ayarı, öğrenme ofseti, kayıtlı şehirler ve
 * günlük hatırlatma tercihleri. Tümü tek AsyncStorage kaydında tutulur.
 */

const PROFILE_KEY = 'negiysem:profile:v1';

export type NotificationPeriod = 'sabah' | 'aksam';

/** Widget arka plan saydamlığı: 'solid' dolu, 'translucent' yarı saydam, 'clear' çok saydam. */
export type WidgetBgMode = 'solid' | 'translucent' | 'clear';

export interface StoredProfile {
  coldSensitivity: ColdSensitivity;
  /** Öğrenilen ofset, −3…+3. */
  learnedOffset: number;
  /** Kayıtlı şehirler (Konumlar ekranı). */
  cities: Place[];
  /** Akşam "yarın ne giyeceksin?" hatırlatması. */
  notifEnabled: boolean;
  notifPeriod: NotificationPeriod;
  notifHour: number;
  notifMinute: number;
  /** Widget arka plan saydamlığı. */
  widgetBg: WidgetBgMode;
  /** Mini gardırop: kullanıcının sahip olduğu garment id'leri (tekrar edebilir). */
  wardrobe: string[];
  /** Anlık hava değişimi bildirimleri (yağmur, sert düşüş, fırtına). */
  instantAlerts: boolean;
}

export const DEFAULT_STORED_PROFILE: StoredProfile = {
  coldSensitivity: 'normal',
  learnedOffset: 0,
  cities: [],
  notifEnabled: NOTIFICATION_DEFAULTS.enabled,
  notifPeriod: NOTIFICATION_DEFAULTS.period,
  notifHour: NOTIFICATION_DEFAULTS.hour,
  notifMinute: NOTIFICATION_DEFAULTS.minute,
  widgetBg: 'solid',
  wardrobe: [],
  instantAlerts: false,
};

const COLD_SENSITIVITIES: readonly ColdSensitivity[] = ['none', 'little', 'normal', 'quick', 'very'];
const NOTIF_PERIODS: readonly NotificationPeriod[] = ['sabah', 'aksam'];
const WIDGET_BG_MODES: readonly WidgetBgMode[] = ['solid', 'translucent', 'clear'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clampOffset(value: number): number {
  return Math.min(
    OUTFIT_THRESHOLDS.learnedOffsetMax,
    Math.max(OUTFIT_THRESHOLDS.learnedOffsetMin, value)
  );
}

function clampHour(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23
    ? value
    : DEFAULT_STORED_PROFILE.notifHour;
}

function clampMinute(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59
    ? value
    : DEFAULT_STORED_PROFILE.notifMinute;
}

/** Ham kaydı doğrular; bozuk alanlar varsayılana düşer. */
function sanitize(raw: unknown): StoredProfile {
  if (!isRecord(raw)) return { ...DEFAULT_STORED_PROFILE };

  const cold = raw.coldSensitivity;
  const period = raw.notifPeriod;
  const cities = Array.isArray(raw.cities) ? raw.cities : [];

  return {
    coldSensitivity: COLD_SENSITIVITIES.includes(cold as ColdSensitivity)
      ? (cold as ColdSensitivity)
      : DEFAULT_STORED_PROFILE.coldSensitivity,
    learnedOffset:
      typeof raw.learnedOffset === 'number' && Number.isFinite(raw.learnedOffset)
        ? clampOffset(raw.learnedOffset)
        : 0,
    cities: cities.filter(
      (item): item is Place =>
        isRecord(item) &&
        typeof item.name === 'string' &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number'
    ),
    notifEnabled: typeof raw.notifEnabled === 'boolean' ? raw.notifEnabled : DEFAULT_STORED_PROFILE.notifEnabled,
    notifPeriod: NOTIF_PERIODS.includes(period as NotificationPeriod)
      ? (period as NotificationPeriod)
      : DEFAULT_STORED_PROFILE.notifPeriod,
    notifHour: clampHour(raw.notifHour),
    notifMinute: clampMinute(raw.notifMinute),
    widgetBg: WIDGET_BG_MODES.includes(raw.widgetBg as WidgetBgMode)
      ? (raw.widgetBg as WidgetBgMode)
      : DEFAULT_STORED_PROFILE.widgetBg,
    wardrobe: Array.isArray(raw.wardrobe)
      ? raw.wardrobe.filter((item): item is string => typeof item === 'string')
      : [],
    instantAlerts: raw.instantAlerts === true,
  };
}

/** Profili varsayılanlara sıfırlar (onay geri çekme / veri silme). */
export async function resetStoredProfile(): Promise<StoredProfile> {
  const next = { ...DEFAULT_STORED_PROFILE, cities: [] };
  await save(next);
  return next;
}

export async function getStoredProfile(): Promise<StoredProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw === null) return { ...DEFAULT_STORED_PROFILE };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STORED_PROFILE };
  }
}

async function save(profile: StoredProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Depolama hatası kritik değil.
  }
}

export async function setColdSensitivity(value: ColdSensitivity): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = { ...profile, coldSensitivity: value };
  await save(next);
  return next;
}

export async function setLearnedOffset(value: number): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = { ...profile, learnedOffset: clampOffset(value) };
  await save(next);
  return next;
}

export async function setNotifEnabled(value: boolean): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = { ...profile, notifEnabled: value };
  await save(next);
  return next;
}

export async function setNotifSchedule(
  period: NotificationPeriod,
  hour: number,
  minute: number
): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = {
    ...profile,
    notifPeriod: period,
    notifHour: clampHour(hour),
    notifMinute: clampMinute(minute),
  };
  await save(next);
  return next;
}

export async function setWidgetBg(value: WidgetBgMode): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = { ...profile, widgetBg: value };
  await save(next);
  return next;
}

export async function setInstantAlerts(value: boolean): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = { ...profile, instantAlerts: value };
  await save(next);
  return next;
}

/** Gardıroba parça ekler/çıkarır (aynı id iki kez eklenirse ikisi de kalır). */
export async function toggleWardrobeItem(garmentId: string): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const index = profile.wardrobe.indexOf(garmentId);
  const wardrobe =
    index === -1
      ? [...profile.wardrobe, garmentId]
      : profile.wardrobe.filter((_, i) => i !== index);
  const next = { ...profile, wardrobe };
  await save(next);
  return next;
}

/** Şehri listeye ekler; aynı isim+koordinat varsa tekrar eklemez. */
export async function addCity(place: Place): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const exists = profile.cities.some(
    (city) =>
      city.name === place.name &&
      Math.abs(city.latitude - place.latitude) < 0.01 &&
      Math.abs(city.longitude - place.longitude) < 0.01
  );
  if (exists) return profile;
  const next = { ...profile, cities: [...profile.cities, place] };
  await save(next);
  return next;
}

export async function removeCity(place: Place): Promise<StoredProfile> {
  const profile = await getStoredProfile();
  const next = {
    ...profile,
    cities: profile.cities.filter(
      (city) =>
        !(city.name === place.name && city.latitude === place.latitude && city.longitude === place.longitude)
    ),
  };
  await save(next);
  return next;
}

/** Saklanan profili motorun `OutfitProfile` girdisine çevirir. */
export function toOutfitProfile(profile: StoredProfile): OutfitProfile {
  return {
    coldSensitivity: profile.coldSensitivity,
    transport: 'walk',
    learnedOffset: profile.learnedOffset,
  };
}
