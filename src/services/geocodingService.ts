import { GEOCODING_API_URL, MIN_SEARCH_LENGTH } from '@/constants/config';
import { ServiceError, fetchJson } from '@/services/http';
import type { Place } from '@/types';

/** Open-Meteo Geocoding API tek bir sonucu. */
interface GeocodingResult {
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  country?: unknown;
  admin1?: unknown;
  admin2?: unknown;
  country_code?: unknown;
}

interface GeocodingResponse {
  results?: unknown;
}

function optionalString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isNumeric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Şehir adına göre yer arar (Open-Meteo Geocoding API).
 * Sonuç yoksa boş dizi döner; teknik hata olursa `ServiceError` fırlatır.
 */
export async function searchCities(query: string, countryCode?: string | null): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_SEARCH_LENGTH) return [];

  let url =
    `${GEOCODING_API_URL}?name=${encodeURIComponent(trimmed)}` +
    '&count=8&language=tr&format=json';
  // Ülke süzgeci verilirse yalnızca o ülkedeki sonuçlar döner (varsayılan: Türkiye).
  // API küçük harf ISO kodu bekler; istemci tarafında da doğrulanır.
  const code = countryCode?.toLowerCase() ?? null;
  if (code) {
    url += `&country_code=${encodeURIComponent(code)}`;
  }

  const response = await fetchJson<GeocodingResponse>(url);
  const results = Array.isArray(response.results) ? response.results : [];

  const places: Place[] = [];
  for (const entry of results) {
    const candidate = entry as GeocodingResult;
    if (typeof candidate.name !== 'string' || candidate.name.length === 0) continue;
    if (!isNumeric(candidate.latitude) || !isNumeric(candidate.longitude)) continue;

    const admin1 = optionalString(candidate.admin1);
    const admin2 = optionalString(candidate.admin2);
    const country = optionalString(candidate.country);

    // Sunucu süzgeci yeterli değilse istemci tarafında da ülkeyi doğrula —
    // seçili ülke dışındaki sonuçlar listeye hiç girmesin.
    if (code) {
      const resultCode = optionalString(candidate.country_code).toLowerCase();
      if (resultCode && resultCode !== code) continue;
    }

    places.push({
      name: candidate.name,
      region: admin1 || admin2,
      country,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      source: 'search',
    });
  }

  if (places.length === 0 && results.length > 0) {
    throw new ServiceError('parse', 'Şehir verisi okunamadı.');
  }

  return places;
}
