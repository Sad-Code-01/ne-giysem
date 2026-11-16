import { createContext, useContext, type ReactNode } from 'react';

import { useWeatherOutfit, type WeatherOutfitState } from '@/hooks/useWeatherOutfit';

const WeatherContext = createContext<WeatherOutfitState | null>(null);

/** Hava durumu akışını uygulama genelinde tek örnek olarak paylaşır. */
export function WeatherProvider({ children }: { children: ReactNode }) {
  const state = useWeatherOutfit();
  return <WeatherContext.Provider value={state}>{children}</WeatherContext.Provider>;
}

/** Provider içinden hava durumu durumunu döner. */
export function useWeatherContext(): WeatherOutfitState {
  const ctx = useContext(WeatherContext);
  if (!ctx) {
    throw new Error('useWeatherContext, WeatherProvider içinde kullanılmalıdır.');
  }
  return ctx;
}
