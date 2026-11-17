/**
 * Resmî uyarı kaynakları — Ayarlar'daki "Resmî uyarılar" bölümü.
 * Yalnızca açıldığı doğrulanmış resmî kurum sayfaları listelenir.
 * Canlı başlık beslemesi yok: MGM'in WMO CAP feed URL'si kayıtlı değil,
 * AFAD RSS akışları afet uyarısı değil akreditasyon duyurusu içeriyor.
 */

export interface OfficialSource {
  id: string;
  /** Kurum adı. */
  name: string;
  /** Tek satır açıklama. */
  description: string;
  url: string;
}

export const OFFICIAL_SOURCES: readonly OfficialSource[] = [
  {
    id: 'mgm-meteouyari',
    name: 'Meteoroloji (MGM)',
    description: 'Meteoroloji uyarıları',
    url: 'https://www.mgm.gov.tr/Meteouyari/turkiye.aspx',
  },
  {
    id: 'mgm-uyari',
    name: 'Meteoroloji (MGM)',
    description: 'Kurum ana sayfası',
    url: 'https://www.mgm.gov.tr',
  },
] as const;

/** Türkçe karakter → MGM'in il parametresindeki ASCII karşılığı. */
const MGM_CHAR_MAP: Record<string, string> = {
  İ: 'I',
  I: 'I',
  ı: 'I',
  i: 'I',
  Ğ: 'G',
  ğ: 'G',
  Ü: 'U',
  ü: 'U',
  Ş: 'S',
  ş: 'S',
  Ö: 'O',
  ö: 'O',
  Ç: 'C',
  ç: 'C',
};

/**
 * İl/ilçe adını MGM `il` parametresine çevirir:
 * "Elâzığ" → "ELAZIG", "Şanlıurfa" → "SANLIURFA", boşluklar atılır.
 */
export function toMgmIlKey(name: string): string {
  return name
    .toLocaleUpperCase('tr-TR')
    .split('')
    .map((char) => MGM_CHAR_MAP[char] ?? char)
    .join('')
    .replace(/\s+/g, '');
}

/** MGM il ve ilçe uyarı sayfası (doğrulanmış URL şablonu). */
export function mgmIlUrl(ilKey: string): string {
  return `https://mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=${encodeURIComponent(ilKey)}`;
}
