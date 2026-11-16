import en from './en.json';
import tr from './tr.json';

/**
 * Basit i18n (Yönerge 6.12): TR/EN, `t('key')` ile erişim.
 * Dil, ProfileProvider tarafından `setLanguage` ile güncellenir.
 * Cihaz dili ilk açılışta `getDeviceLanguage` ile seçilir.
 */

export type AppLanguage = 'tr' | 'en';

const MESSAGES: Record<AppLanguage, Record<string, string>> = {
  tr: tr as Record<string, string>,
  en: en as Record<string, string>,
};

let currentLanguage: AppLanguage = 'tr';

export function setLanguage(lang: AppLanguage): void {
  currentLanguage = lang;
}

export function getLanguage(): AppLanguage {
  return currentLanguage;
}

/** `toLocaleDateString`/`toLocaleTimeString` için BCP-47 locale. */
export function locale(): string {
  return currentLanguage === 'en' ? 'en-US' : 'tr-TR';
}

/** Uygulama her zaman Türkçe açılır; EN yalnızca kullanıcı seçerse. */
export function deviceLanguage(): AppLanguage {
  return 'tr';
}

/** Çeviri anahtarı → metin. Parametreler `{name}` kalıbıyla doldurulur. */
export function t(key: string, params?: Record<string, string | number>): string {
  const table = MESSAGES[currentLanguage] ?? MESSAGES.tr;
  let text = table[key] ?? MESSAGES.tr[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
