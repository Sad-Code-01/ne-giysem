import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useProfile } from '@/hooks/useProfile';

import { CACHE_MAX_AGE_MS, FOREGROUND_REFRESH_MS } from '@/constants/config';
import { isConsentValid } from '@/logic/consent';
import { locale } from '@/i18n';
import { ServiceError, isServiceError } from '@/services/http';
import { getCurrentPlace, requestLocationPermission } from '@/services/locationService';
import { openMeteoProvider } from '@/services/weather/WeatherProvider';
import { maybeSendInstantAlerts } from '@/services/instantAlertService';
import { getConsent } from '@/storage/consent';
import { pushWidgetUpdate } from '@/widgets/resolveWidgetData';
import {
  getLastSnapshot,
  getOnboardingDone,
  getSelectedPlace,
  setLastSnapshot,
  setSelectedPlace,
} from '@/storage/cache';
import type { Place, ServiceErrorKind, WeatherSnapshot } from '@/types';

export type WeatherStatus = 'idle' | 'welcome' | 'loading' | 'ready' | 'error';

export interface WeatherOutfitState {
  status: WeatherStatus;
  snapshot: WeatherSnapshot | null;
  errorKind: ServiceErrorKind | null;
  isOffline: boolean;
  isRefreshing: boolean;
  /** Önbellekten gösteriliyorsa "HH:MM" biçiminde son güncelleme saati. */
  lastUpdatedLabel: string | null;
  /** Açılış akışını yeniden çalıştırır (onboarding bitince çağrılır). */
  start: () => Promise<void>;
  loadMyLocation: () => Promise<void>;
  refresh: () => Promise<void>;
  selectPlace: (place: Place) => Promise<void>;
}

function formatClockTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(locale(), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Ana akış: onay+karşılama kapısı → kayıtlı yer/konum → hava durumu → öneri.
 * Stale-while-revalidate: önce son başarılı veri gösterilir, arka planda tazelenir.
 * Asla uydurma veri üretmez.
 */
export function useWeatherOutfit(): WeatherOutfitState {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [errorKind, setErrorKind] = useState<ServiceErrorKind | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMounted = useRef(true);
  const snapshotRef = useRef<WeatherSnapshot | null>(null);
  // Aynı anda birden çok istek başlayabilir (hızlı dokunuş); yalnızca en
  // son başlatılanın sonucu uygulanır, eskiler sessizce düşer.
  const loadSeq = useRef(0);
  const gpsBusy = useRef(false);
  // addCity context'ten gelir; referans değişse bile load yeniden kurulmasın.
  const { addCity } = useProfile();
  const addCityRef = useRef(addCity);
  useEffect(() => {
    addCityRef.current = addCity;
  }, [addCity]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  /** Çevrimdışı hatasında son başarılı veriyi önbellekten gösterir. */
  const showCachedSnapshot = useCallback(async (): Promise<boolean> => {
    const cached = await getLastSnapshot();
    if (!cached || !isMounted.current) return false;

    setSnapshot(cached);
    setIsOffline(true);
    setErrorKind(null);
    setStatus('ready');
    return true;
  }, []);

  const handleFailure = useCallback(
    async (error: unknown, fallbackKind: ServiceErrorKind): Promise<void> => {
      const kind = isServiceError(error) ? error.kind : fallbackKind;
      if (!isMounted.current) return;

      // Bellekte/önbellekte veri varsa hatayı "çevrimdışı" olarak göster, ekranı koru.
      if ((kind === 'offline' || kind === 'api') && (await showCachedSnapshot())) return;
      if (snapshotRef.current) {
        setIsOffline(true);
        setErrorKind(kind);
        setStatus('ready');
        return;
      }

      setErrorKind(kind);
      setStatus('error');
    },
    [showCachedSnapshot]
  );

  /** Verilen yer için hava durumunu çeker; başarılıysa true döner. */
  const load = useCallback(
    async (place: Place): Promise<boolean> => {
      const seq = ++loadSeq.current;
      const prev = snapshotRef.current;
      try {
        const fresh = await openMeteoProvider.fetchWeather(place);
        if (!isMounted.current || seq !== loadSeq.current) return false;

        setSnapshot(fresh);
        setIsOffline(false);
        setErrorKind(null);
        setStatus('ready');
        await setLastSnapshot(fresh);
        void pushWidgetUpdate();
        void maybeSendInstantAlerts(prev, fresh);
        // GPS'ten otomatik çekilen konum "Konumlarım" listesine de eklensin.
        if (place.source === 'gps') {
          void addCityRef.current(place);
        }
        return true;
      } catch (error) {
        if (isMounted.current && seq === loadSeq.current) {
          await handleFailure(error, 'api');
        }
        return false;
      }
    },
    [handleFailure]
  );

  /** Kayıtlı şehir varsa onu, yoksa konum izniyle mevcut konumu çözer. */
  const resolvePlace = useCallback(async (): Promise<Place> => {
    const saved = await getSelectedPlace();
    if (saved) return saved;

    const granted = await requestLocationPermission();
    if (!granted) throw new ServiceError('permission', 'Konum izni verilmedi.');
    return getCurrentPlace();
  }, []);

  /**
   * Açılış: gizlilik onayı + karşılama akışı tamamlanmadan konum izni istenmez.
   * Önce son başarılı veri anında gösterilir (SWR), sonra tazelenir.
   */
  const start = useCallback(async (): Promise<void> => {
    const [consent, done] = await Promise.all([getConsent(), getOnboardingDone()]);
    if (!isMounted.current) return;
    if (!isConsentValid(consent) || !done) {
      setStatus('idle');
      return;
    }

    const cached = await getLastSnapshot();
    if (!isMounted.current) return;
    const cacheAge = cached ? Date.now() - cached.fetchedAt : Number.POSITIVE_INFINITY;

    // Önbellek hâlâ taze ise doğrudan göster; ağa hiç çıkma.
    if (cached && cacheAge <= CACHE_MAX_AGE_MS) {
      setSnapshot(cached);
      setIsOffline(false);
      setErrorKind(null);
      setStatus('ready');
      return;
    }

    // Bayat önbellek varsa gösterip arka planda tazele.
    if (cached) {
      setSnapshot(cached);
      setIsOffline(true);
      setStatus('ready');
    } else {
      setStatus('loading');
    }

    try {
      const saved = await getSelectedPlace();
      const place = saved ?? (await resolvePlace());
      await load(place);
    } catch (error) {
      if (!isMounted.current) return;
      if (snapshotRef.current) {
        // Önbellek gösteriliyor; hatayı not düş, ekranı bozma.
        setIsOffline(true);
        setErrorKind(isServiceError(error) ? error.kind : 'location');
      } else if (isServiceError(error) && error.kind === 'permission') {
        // Konum izni yok ve kayıtlı yer yok → karşılama görünümüne düş (şehir seçimi mümkün).
        setStatus('welcome');
      } else {
        await handleFailure(error, 'location');
      }
    }
  }, [load, resolvePlace, handleFailure]);

  useEffect(() => {
    // Açılış akışı async; efekt gövdesinde senkron setState tetiklenmesin.
    const timer = setTimeout(() => void start(), 0);
    return () => clearTimeout(timer);
  }, [start]);

  /** Konum ikonuna dokunulduğunda mevcut konumu yeniden çözer. */
  const loadMyLocation = useCallback(async (): Promise<void> => {
    // Üst üste dokunuşta ikinci izin diyaloğu/istek pilemesin.
    if (gpsBusy.current) return;
    gpsBusy.current = true;
    setStatus('loading');
    setErrorKind(null);

    try {
      const place = await getCurrentPlace();
      // Konum ancak hava verisi başarıyla çekilirse kalıcı olur;
      // aksi hâlde eski kayıtlı yer korunur.
      if (await load(place)) {
        await setSelectedPlace(place);
      }
    } catch (error) {
      await handleFailure(error, 'location');
    } finally {
      gpsBusy.current = false;
    }
  }, [load, handleFailure]);

  /** Şehir aramasından seçilen yeri yükler; başarılıysa hatırlar. */
  const selectPlace = useCallback(
    async (place: Place): Promise<void> => {
      setStatus('loading');
      setErrorKind(null);
      if (await load(place)) {
        await setSelectedPlace(place);
      }
    },
    [load]
  );

  /** Pull-to-refresh: mevcut yeri yeniden çeker. */
  const refresh = useCallback(async (): Promise<void> => {
    const current = snapshotRef.current;
    if (!current) return;

    setIsRefreshing(true);
    try {
      await load(current.place);
    } finally {
      if (isMounted.current) setIsRefreshing(false);
    }
  }, [load]);

  // Uygulama öne geldiğinde veri 30 dakikadan eskiyse sessizce yenile.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active') return;

      const current = snapshotRef.current;
      if (current && Date.now() - current.fetchedAt > FOREGROUND_REFRESH_MS) {
        void load(current.place);
      }
    });

    return () => subscription.remove();
  }, [load]);

  const lastUpdatedLabel =
    isOffline && snapshot ? formatClockTime(snapshot.fetchedAt) : null;

  return {
    status,
    snapshot,
    errorKind,
    isOffline,
    isRefreshing,
    lastUpdatedLabel,
    start,
    loadMyLocation,
    refresh,
    selectPlace,
  };
}
