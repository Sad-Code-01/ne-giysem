import { Platform } from 'react-native';

import {
  WIDGET_MAX_SUGGESTION_AGE_MS,
  WIDGET_REFRESH_AGE_MS,
} from '@/constants/widget';
import { isConsentValid } from '@/logic/consent';
import { t } from '@/i18n';
import {
  WIDGET_EMPTY_CONTENT,
  buildWidgetContent,
  type WidgetContent,
} from '@/logic/widgetContent';
import { openMeteoProvider } from '@/services/weather/WeatherProvider';
import { getConsent } from '@/storage/consent';
import { getLastSnapshot, getSelectedPlace, setLastSnapshot } from '@/storage/cache';
import { getStoredProfile, toOutfitProfile } from '@/storage/profileStore';
import type { OutfitProfile, WeatherSnapshot } from '@/types';

/**
 * Widget veri çözümleme (headless güvenli — hook yok, saf async).
 * Sıra: onay+yer → ≤30 dk önbellek → ağ yenileme → bayat gösterim.
 * Uydurma veri yok; her şey AsyncStorage + Open-Meteo'dan gelir.
 */

export interface ResolvedWidgetData {
  content: WidgetContent;
  /** Çözülen anlık snapshot (varsa). */
  snapshot: WeatherSnapshot | null;
  profile: OutfitProfile | null;
}

function staleLabelFor(snapshot: WeatherSnapshot, now: number): string {
  const time = new Date(snapshot.fetchedAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${t('widget.stale')} · ${time}`;
}

/** Widget için güncel hava verisini çözer. `now` testlerde ezilebilir. */
export async function resolveWidgetData(now: number = Date.now()): Promise<ResolvedWidgetData> {
  const [consent, place, storedProfile] = await Promise.all([
    getConsent(),
    getSelectedPlace(),
    getStoredProfile(),
  ]);
  const profile = toOutfitProfile(storedProfile);

  if (!isConsentValid(consent) || !place) {
    return {
      content: { ...WIDGET_EMPTY_CONTENT, bgMode: storedProfile.widgetBg },
      snapshot: null,
      profile,
    };
  }

  const cached = await getLastSnapshot();
  const cacheAge = cached ? now - cached.fetchedAt : Number.POSITIVE_INFINITY;
  const bgMode = storedProfile.widgetBg;

  // Taze önbellek: doğrudan kullan.
  if (cached && cacheAge <= WIDGET_REFRESH_AGE_MS) {
    return {
      content: buildWidgetContent(cached, profile, { bgMode }),
      snapshot: cached,
      profile,
    };
  }

  // Bayatsa Open-Meteo'dan yenile; başarısızsa kurallara göre bayat göster.
  try {
    const fresh = await openMeteoProvider.fetchWeather(place);
    await setLastSnapshot(fresh);
    return {
      content: buildWidgetContent(fresh, profile, { bgMode }),
      snapshot: fresh,
      profile,
    };
  } catch {
    if (!cached) {
      // Hiç veri yok ve ağ da yok → boş durum.
      return {
        content: { ...WIDGET_EMPTY_CONTENT, bgMode },
        snapshot: null,
        profile,
      };
    }

    const age = now - cached.fetchedAt;
    const includeSuggestion = age <= WIDGET_MAX_SUGGESTION_AGE_MS;
    return {
      content: buildWidgetContent(cached, profile, {
        staleLabel: staleLabelFor(cached, now),
        includeSuggestion,
        bgMode,
      }),
      snapshot: cached,
      profile,
    };
  }
}

/** Uygulama içinden widget'ları anında güncellemek için (her başarılı yenilemede çağrılır). */
export async function pushWidgetUpdate(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // Native modül Expo Go'da yok; lazy require + try/catch ile güvenli.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestWidgetUpdate } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    const { renderWidgetTrees } = await import('@/widgets/render');
    const data = await resolveWidgetData();

    for (const widgetName of ['Mini', 'Kucuk', 'Orta'] as const) {
      await requestWidgetUpdate({
        widgetName,
        renderWidget: () => renderWidgetTrees(widgetName, data.content),
        widgetNotFound: () => undefined,
      });
    }
  } catch {
    // Widget modülü yoksa (Expo Go / web) sessizce geç.
  }
}
