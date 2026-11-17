import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

import { DARK_THEME, LIGHT_THEME, type AppTheme } from '@/theme/tokens';
import { getThemeMode, subscribeThemeMode, type ThemeMode } from '@/theme/themeMode';

/**
 * Tema modu (Sistem/Açık/Koyu) + sistem rengini birleştirir.
 * Palet sabittir; hava durumu rengi değiştirmez.
 */
export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);

  useEffect(() => subscribeThemeMode(() => setMode(getThemeMode())), []);

  const dark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  return dark ? DARK_THEME : LIGHT_THEME;
}
