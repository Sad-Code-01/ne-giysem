/**
 * Resmî uyarı kaynakları — Uyarılar sekmesindeki kartlar.
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
    id: 'mgm-uyari',
    name: 'Meteoroloji (MGM)',
    description: 'Meteorolojik uyarılar',
    url: 'https://www.mgm.gov.tr',
  },
  {
    id: 'mgm-il',
    name: 'MGM',
    description: 'İl seçerek uyarıya bak',
    url: 'https://mgm.gov.tr/mobile/merkez-sec.aspx',
  },
] as const;
