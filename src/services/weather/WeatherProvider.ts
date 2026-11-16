import type { Place, WeatherSnapshot } from '@/types';

import { fetchOpenMeteoWeather } from './openMeteo';

/**
 * Hava durumu sağlayıcı arayüzü (Yönerge 2).
 * İleride alternatif kaynaklar (arşiv, widget köprüsü) aynı imzayla eklenebilir.
 */
export interface WeatherProvider {
  fetchWeather(place: Place): Promise<WeatherSnapshot>;
}

/** Open-Meteo tabanlı sağlayıcı. */
export const openMeteoProvider: WeatherProvider = {
  fetchWeather: fetchOpenMeteoWeather,
};
