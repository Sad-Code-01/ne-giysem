import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { deviceLanguage, setLanguage as setI18nLanguage } from '@/i18n';
import {
  addCity,
  getStoredProfile,
  removeCity,
  resetStoredProfile,
  setColdSensitivity,
  setLearnedOffset,
  setNotifEnabled,
  setNotifSchedule,
  setWidgetBg,
  toOutfitProfile,
  type NotificationPeriod,
  type StoredProfile,
  type WidgetBgMode,
} from '@/storage/profileStore';
import { pushWidgetUpdate } from '@/widgets/resolveWidgetData';
import type { ColdSensitivity, OutfitProfile, Place } from '@/types';

/**
 * Profil bağlamı: üşüme ayarı, şehirler, öğrenme ofseti ve bildirim tercihleri.
 * Tüm uygulama tek örnek üzerinden okur; değişiklikler anında yansır.
 */

interface ProfileContextValue {
  profile: StoredProfile;
  /** Motora verilen sade profil. */
  outfitProfile: OutfitProfile;
  setColdSensitivity: (value: ColdSensitivity) => Promise<void>;
  setLearnedOffset: (value: number) => Promise<void>;
  setNotifEnabled: (value: boolean) => Promise<void>;
  setNotifSchedule: (period: NotificationPeriod, hour: number, minute: number) => Promise<void>;
  setWidgetBg: (value: WidgetBgMode) => Promise<void>;
  addCity: (place: Place) => Promise<void>;
  removeCity: (place: Place) => Promise<void>;
  /** Tüm profil verilerini varsayılanlara sıfırlar. */
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getStoredProfile().then((stored) => {
      if (cancelled) return;
      setProfile(stored);
      setI18nLanguage(deviceLanguage());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ProfileContextValue | null>(() => {
    if (!profile) return null;
    return {
      profile,
      outfitProfile: toOutfitProfile(profile),
      setColdSensitivity: async (cold) => {
        setProfile(await setColdSensitivity(cold));
        void pushWidgetUpdate();
      },
      setLearnedOffset: async (offset) => {
        setProfile(await setLearnedOffset(offset));
        void pushWidgetUpdate();
      },
      setWidgetBg: async (mode) => {
        setProfile(await setWidgetBg(mode));
        void pushWidgetUpdate();
      },
      setNotifEnabled: async (enabled) => {
        setProfile(await setNotifEnabled(enabled));
      },
      setNotifSchedule: async (period, hour, minute) => {
        setProfile(await setNotifSchedule(period, hour, minute));
      },
      addCity: async (place) => {
        setProfile(await addCity(place));
      },
      removeCity: async (place) => {
        setProfile(await removeCity(place));
      },
      resetProfile: async () => {
        setProfile(await resetStoredProfile());
      },
    };
  }, [profile]);

  // Profil yüklenene kadar çocukları bekletme; ekranlar `useProfile` ile null kontrol eder.
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    // Sağlayıcı henüz yüklenmediyse varsayılanlarla devam et (ekran flash'ını önler).
    return {
      profile: {
        coldSensitivity: 'normal',
        learnedOffset: 0,
        cities: [],
        notifEnabled: false,
        notifPeriod: 'aksam',
        notifHour: 21,
        notifMinute: 0,
        widgetBg: 'solid',
      },
      outfitProfile: { coldSensitivity: 'normal', transport: 'walk', learnedOffset: 0 },
      setColdSensitivity: async () => undefined,
      setLearnedOffset: async () => undefined,
      setNotifEnabled: async () => undefined,
      setNotifSchedule: async () => undefined,
      setWidgetBg: async () => undefined,
      addCity: async () => undefined,
      removeCity: async () => undefined,
      resetProfile: async () => undefined,
    };
  }
  return ctx;
}
