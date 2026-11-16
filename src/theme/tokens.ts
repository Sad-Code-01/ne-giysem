/**
 * "Ne Giysem?" etiket kimliği (Yönerge 7.1).
 * Açık ve koyu paletler elle seçilmiştir; hava durumuna göre değişmez.
 * Aksan yalnızca dolgudur; üzerinde ana renk metin kullanılır.
 */

export interface AppTheme {
  isDark: boolean;
  bg: string;
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
  /** Aksan dolgu üzerindeki metin (ana renk). */
  onAccent: string;
}

export const LIGHT_THEME: AppTheme = {
  isDark: false,
  bg: '#F1F0EA',
  surface: '#E6E4DA',
  primary: '#1E3A34',
  secondary: '#3F6296',
  accent: '#F0A12B',
  text: '#1B1F1D',
  textSecondary: '#4D5A54',
  line: '#1E3A34',
  scrim: 'rgba(0,0,0,0.45)',
  onPrimary: '#F1F0EA',
  onAccent: '#1E3A34',
};

export const DARK_THEME: AppTheme = {
  isDark: true,
  bg: '#121A17',
  surface: '#1C2824',
  primary: '#9FD3B8',
  secondary: '#8FB0E0',
  accent: '#F0A12B',
  text: '#EDEFE9',
  textSecondary: '#B4BDB7',
  line: '#9FD3B8',
  scrim: 'rgba(0,0,0,0.45)',
  onPrimary: '#121A17',
  onAccent: '#1E3A34',
};
