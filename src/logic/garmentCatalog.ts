import { t } from '@/i18n';
import type { Garment, GarmentCategory } from '@/types';

/**
 * Kıyafet kataloğu (Yönerge 6.1).
 * `warmth` 0–10 sıcaklık puanı; `waterproof`/`windproof` koşul düzeltmelerinde kullanılır.
 * Görseller `GarmentImage` içinde SVG ile çizilir (assets/garments PNG'leri kullanıcı sağlayacak).
 */

function g(
  id: string,
  label: string,
  category: GarmentCategory,
  warmth: number,
  waterproof = false,
  windproof = false
): Garment {
  return { id, label, category, warmth, waterproof, windproof };
}

export const GARMENTS: readonly Garment[] = [
  // Üst
  g('atlet', 'Atlet', 'top', 1),
  g('tisort', 'Tişört', 'top', 1),
  g('uzun-kollu', 'Uzun kollu', 'top', 2),
  g('gomlek', 'Gömlek', 'top', 2),
  g('sweatshirt', 'Sweatshirt', 'top', 3),
  g('kazak', 'Kazak', 'top', 4),
  // Ara katman
  g('termal-ust', 'Termal', 'base', 2),
  g('hirka', 'Hırka', 'mid', 3),
  // Alt
  g('sort', 'Şort', 'bottom', 1),
  g('ince-pantolon', 'İnce pantolon', 'bottom', 1),
  g('jean', 'Jean', 'bottom', 2),
  g('chino', 'Chino', 'bottom', 2),
  g('kalin-pantolon', 'Kalın pantolon', 'bottom', 3),
  g('termal-alt', 'Termal alt', 'base-bottom', 2),
  // Dış giyim
  g('ince-ceket', 'İnce ceket', 'outer', 3),
  g('ruzgarlik', 'Rüzgârlık', 'outer', 2, false, true),
  g('yagmurluk', 'Yağmurluk', 'outer', 2, true, true),
  g('mont', 'Mont', 'outer', 6),
  g('su-gecirmez-mont', 'Su geçirmez mont', 'outer', 6, true, true),
  g('kalin-mont', 'Kalın mont', 'outer', 8, false, true),
  g('cok-kalin-mont', 'Çok kalın mont', 'outer', 9, true, true),
  // Ayakkabı
  g('sandalet', 'Sandalet', 'shoes', 0),
  g('spor-ayakkabi', 'Spor ayakkabı', 'shoes', 0),
  g('kapali-ayakkabi', 'Kapalı ayakkabı', 'shoes', 1),
  g('bot', 'Bot', 'shoes', 2),
  g('su-gecirmez-bot', 'Su geçirmez bot', 'shoes', 3, true),
  // Aksesuar
  g('semsiye', 'Şemsiye', 'accessory', 0),
  g('sapka', 'Şapka', 'accessory', 0),
  g('gunes-gozlugu', 'Güneş gözlüğü', 'accessory', 0),
  g('bere', 'Bere', 'accessory', 1),
  g('atki', 'Atkı', 'accessory', 1),
  g('eldiven', 'Eldiven', 'accessory', 1),
];

const BY_ID = new Map<string, Garment>(GARMENTS.map((item) => [item.id, item]));

/** Kimliğe göre kıyafet parçasını döner; bilinmeyen id → hata yerine null. */
export function getGarment(id: string): Garment | null {
  return BY_ID.get(id) ?? null;
}

/** Kimliğe göre kıyafet parçasını döner; yoksa hata fırlatır (motor içi kullanım). */
export function requireGarment(id: string): Garment {
  const garment = BY_ID.get(id);
  if (!garment) throw new Error(`Katalogda olmayan kıyafet: ${id}`);
  return garment;
}

/** Kullanıcıya görünen kıyafet etiketi (i18n). */
export function garmentLabel(garment: Garment): string {
  return t(`garment.${garment.id}`);
}
