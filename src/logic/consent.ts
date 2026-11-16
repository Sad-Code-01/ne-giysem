/**
 * Gizlilik onayı durum makinesi (saf mantık — depolamadan bağımsız, test edilebilir).
 *
 * Kurallar:
 * - Onay yoksa uygulama ana akışına geçemez.
 * - Kayıtlı sürüm CONSENT_VERSION'dan eskiyse yeniden sorulur.
 * - Kayıt bozuksa/geçersizse onay sayılmaz.
 */

export const CONSENT_VERSION = 1;

export interface ConsentRecord {
  version: number;
  acceptedAt: number;
}

export function isConsentValid(record: ConsentRecord | null | undefined): boolean {
  return (
    record !== null &&
    record !== undefined &&
    typeof record === 'object' &&
    record.version === CONSENT_VERSION &&
    typeof record.acceptedAt === 'number' &&
    Number.isFinite(record.acceptedAt)
  );
}

/** Onay kaydı geçerli değilse (yok / eski sürüm / bozuk) onay ekranı gerekir. */
export function needsConsent(record: ConsentRecord | null | undefined): boolean {
  return !isConsentValid(record);
}

/** Ham AsyncStorage verisini ConsentRecord'a çevirir; geçersizse null. */
export function parseConsentRecord(raw: unknown): ConsentRecord | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const candidate: ConsentRecord = {
    version: typeof record.version === 'number' ? record.version : -1,
    acceptedAt: typeof record.acceptedAt === 'number' ? record.acceptedAt : NaN,
  };
  return isConsentValid(candidate) ? candidate : null;
}
