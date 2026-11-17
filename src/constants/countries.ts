/**
 * Şehir arama ülke süzgeci — Open-Meteo `country_code` (ISO 3166-1 alpha-2).
 * `null` kodu "Tüm ülkeler" anlamına gelir (süzgeç yok).
 * Liste alfabetik ada göre sıralanır; adlar tr/en locale'ine göre seçilir.
 */
export interface CountryOption {
  /** ISO 3166-1 alpha-2; null → tüm ülkeler. */
  code: string | null;
  tr: string;
  en: string;
}

const COUNTRIES: readonly { code: string; tr: string; en: string }[] = [
  { code: 'TR', tr: 'Türkiye', en: 'Turkey' },
  { code: 'DE', tr: 'Almanya', en: 'Germany' },
  { code: 'NL', tr: 'Hollanda', en: 'Netherlands' },
  { code: 'FR', tr: 'Fransa', en: 'France' },
  { code: 'GB', tr: 'İngiltere', en: 'United Kingdom' },
  { code: 'US', tr: 'ABD', en: 'United States' },
  { code: 'AT', tr: 'Avusturya', en: 'Austria' },
  { code: 'BE', tr: 'Belçika', en: 'Belgium' },
  { code: 'CH', tr: 'İsviçre', en: 'Switzerland' },
  { code: 'IT', tr: 'İtalya', en: 'Italy' },
  { code: 'ES', tr: 'İspanya', en: 'Spain' },
  { code: 'PT', tr: 'Portekiz', en: 'Portugal' },
  { code: 'GR', tr: 'Yunanistan', en: 'Greece' },
  { code: 'BG', tr: 'Bulgaristan', en: 'Bulgaria' },
  { code: 'RO', tr: 'Romanya', en: 'Romania' },
  { code: 'HU', tr: 'Macaristan', en: 'Hungary' },
  { code: 'CZ', tr: 'Çekya', en: 'Czechia' },
  { code: 'SK', tr: 'Slovakya', en: 'Slovakia' },
  { code: 'PL', tr: 'Polonya', en: 'Poland' },
  { code: 'SE', tr: 'İsveç', en: 'Sweden' },
  { code: 'NO', tr: 'Norveç', en: 'Norway' },
  { code: 'DK', tr: 'Danimarka', en: 'Denmark' },
  { code: 'FI', tr: 'Finlandiya', en: 'Finland' },
  { code: 'IE', tr: 'İrlanda', en: 'Ireland' },
  { code: 'RU', tr: 'Rusya', en: 'Russia' },
  { code: 'UA', tr: 'Ukrayna', en: 'Ukraine' },
  { code: 'RS', tr: 'Sırbistan', en: 'Serbia' },
  { code: 'BA', tr: 'Bosna Hersek', en: 'Bosnia and Herzegovina' },
  { code: 'ME', tr: 'Karadağ', en: 'Montenegro' },
  { code: 'MK', tr: 'Kuzey Makedonya', en: 'North Macedonia' },
  { code: 'AL', tr: 'Arnavutluk', en: 'Albania' },
  { code: 'XK', tr: 'Kosova', en: 'Kosovo' },
  { code: 'MD', tr: 'Moldova', en: 'Moldova' },
  { code: 'GE', tr: 'Gürcistan', en: 'Georgia' },
  { code: 'AM', tr: 'Ermenistan', en: 'Armenia' },
  { code: 'AZ', tr: 'Azerbaycan', en: 'Azerbaijan' },
  { code: 'KZ', tr: 'Kazakistan', en: 'Kazakhstan' },
  { code: 'UZ', tr: 'Özbekistan', en: 'Uzbekistan' },
  { code: 'TM', tr: 'Türkmensistan', en: 'Turkmenistan' },
  { code: 'KG', tr: 'Kırgızistan', en: 'Kyrgyzstan' },
  { code: 'TJ', tr: 'Tacikistan', en: 'Tajikistan' },
  { code: 'IR', tr: 'İran', en: 'Iran' },
  { code: 'IQ', tr: 'Irak', en: 'Iraq' },
  { code: 'IL', tr: 'İsrail', en: 'Israel' },
  { code: 'JO', tr: 'Ürdün', en: 'Jordan' },
  { code: 'LB', tr: 'Lübnan', en: 'Lebanon' },
  { code: 'SY', tr: 'Suriye', en: 'Syria' },
  { code: 'SA', tr: 'Suudi Arabistan', en: 'Saudi Arabia' },
  { code: 'AE', tr: 'BAE', en: 'United Arab Emirates' },
  { code: 'QA', tr: 'Katar', en: 'Qatar' },
  { code: 'KW', tr: 'Kuveyt', en: 'Kuwait' },
  { code: 'EG', tr: 'Mısır', en: 'Egypt' },
  { code: 'MA', tr: 'Fas', en: 'Morocco' },
  { code: 'DZ', tr: 'Cezayir', en: 'Algeria' },
  { code: 'TN', tr: 'Tunus', en: 'Tunisia' },
  { code: 'LY', tr: 'Libya', en: 'Libya' },
  { code: 'SD', tr: 'Sudan', en: 'Sudan' },
  { code: 'ET', tr: 'Etiyopya', en: 'Ethiopia' },
  { code: 'KE', tr: 'Kenya', en: 'Kenya' },
  { code: 'NG', tr: 'Nijerya', en: 'Nigeria' },
  { code: 'GH', tr: 'Gana', en: 'Ghana' },
  { code: 'ZA', tr: 'Güney Afrika', en: 'South Africa' },
  { code: 'CA', tr: 'Kanada', en: 'Canada' },
  { code: 'MX', tr: 'Meksika', en: 'Mexico' },
  { code: 'BR', tr: 'Brezilya', en: 'Brazil' },
  { code: 'AR', tr: 'Arjantin', en: 'Argentina' },
  { code: 'CL', tr: 'Şili', en: 'Chile' },
  { code: 'CO', tr: 'Kolombiya', en: 'Colombia' },
  { code: 'AU', tr: 'Avustralya', en: 'Australia' },
  { code: 'NZ', tr: 'Yeni Zelanda', en: 'New Zealand' },
  { code: 'JP', tr: 'Japonya', en: 'Japan' },
  { code: 'KR', tr: 'Güney Kore', en: 'South Korea' },
  { code: 'CN', tr: 'Çin', en: 'China' },
  { code: 'IN', tr: 'Hindistan', en: 'India' },
  { code: 'PK', tr: 'Pakistan', en: 'Pakistan' },
  { code: 'BD', tr: 'Bangladeş', en: 'Bangladesh' },
  { code: 'TH', tr: 'Tayland', en: 'Thailand' },
  { code: 'VN', tr: 'Vietnam', en: 'Vietnam' },
  { code: 'PH', tr: 'Filipinler', en: 'Philippines' },
  { code: 'ID', tr: 'Endonezya', en: 'Indonesia' },
  { code: 'MY', tr: 'Malezya', en: 'Malaysia' },
  { code: 'SG', tr: 'Singapur', en: 'Singapore' },
  { code: 'MN', tr: 'Moğolistan', en: 'Mongolia' },
  { code: 'AF', tr: 'Afganistan', en: 'Afghanistan' },
];

/** Locale'e göre ülke listesi; ilk eleman her zaman "Tüm ülkeler". */
export function countryOptions(locale: string): CountryOption[] {
  const isTr = locale.toLowerCase().startsWith('tr');
  const all: CountryOption = { code: null, tr: 'Tüm ülkeler', en: 'All countries' };
  const list = COUNTRIES.map((c) => ({ code: c.code, tr: c.tr, en: c.en }));
  list.sort((a, b) => a[isTr ? 'tr' : 'en'].localeCompare(b[isTr ? 'tr' : 'en'], isTr ? 'tr' : 'en'));
  return [all, ...list];
}
