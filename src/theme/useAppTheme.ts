import { useColorScheme } from 'react-native';

import { DARK_THEME, LIGHT_THEME, type AppTheme } from '@/theme/tokens';

/**
 * Sistem açık/koyu ayarını izler. Palet sabittir; hava durumu rengi değiştirmez.
 */
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}
