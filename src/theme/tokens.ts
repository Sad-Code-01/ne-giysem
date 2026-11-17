/**
 * "Ne Giysem?" Liquid Glass kimliği.
 * Açık ve koyu paletler elle seçilmiştir; hava durumuna göre değişmez
 * (zemin gradyanı `theme/glass.ts` içindeki sky paletlerinden gelir).
 * Aksan yalnızca dolgudur; üzerinde açık metin kullanılır.
 */

export interface AppTheme {
  isDark: boolean;
  /** Düz zemin yedeği (gradyan desteklenmezse). */
  bg: string;
  /** Opak yüzey yedeği; cam dolgu `glass.ts`'den gelir. */
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  line: string;
  scrim: string;
  /** Ana dolgu üzerindeki metin (zemin rengi). */
  onPrimary: string;
  /** Aksan dolgu üzerindeki metin. */
  onAccent: string;
  /** Sekme çubuğu aktif ikon rengi. */
  tabActive: string;
}

export const LIGHT_THEME: AppTheme = {
  isDark: false,
  bg: '#EDF3FA',
  surface: '#FFFFFF',
  primary: '#2F6FED',
  secondary: '#3F6296',
  accent: '#F0A12B',
  text: '#1B2A3A',
  textSecondary: '#4B5C6E',
  line: '#D8E0EA',
  scrim: 'rgba(10,20,40,0.35)',
  onPrimary: '#FFFFFF',
  onAccent: '#1E3A34',
  tabActive: '#2F6FED',
};

export const DARK_THEME: AppTheme = {
  isDark: true,
  bg: '#0B1119',
  surface: '#1B2733',
  primary: '#8FB8FF',
  secondary: '#8FB0E0',
  accent: '#F0A12B',
  text: '#F2F5F8',
  textSecondary: '#A7B3C0',
  line: 'rgba(255,255,255,0.16)',
  scrim: 'rgba(4,10,20,0.5)',
  onPrimary: '#0B1119',
  onAccent: '#1E3A34',
  tabActive: '#8FB8FF',
};
