import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tema modu deposu: 'system' | 'light' | 'dark'.
 * Modül seviyesinde küçük bir store; `useAppTheme` abone olur.
 */

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'negiysem:theme:v1';

let mode: ThemeMode = 'system';
const listeners = new Set<() => void>();

export function getThemeMode(): ThemeMode {
  return mode;
}

export function subscribeThemeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export async function setThemeMode(next: ThemeMode): Promise<void> {
  mode = next;
  try {
    await AsyncStorage.setItem(THEME_KEY, next);
  } catch {
    // Depolama hatası kritik değil.
  }
  notify();
}

/** Açılışta kayıtlı modu yükler (yoksa 'system'). */
export async function loadThemeMode(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      mode = raw;
    }
  } catch {
    // Varsayılan 'system' kalır.
  }
  notify();
}
