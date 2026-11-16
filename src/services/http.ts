import { REQUEST_TIMEOUT_MS, MAX_ATTEMPTS } from '@/constants/config';
import type { ServiceErrorKind } from '@/types';

/**
 * Servis katmanında oluşan, ekranda doğru mesajın gösterilmesini sağlayan hata türü.
 */
export class ServiceError extends Error {
  readonly kind: ServiceErrorKind;

  constructor(kind: ServiceErrorKind, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.kind = kind;
  }
}

/** Sadece ağ/parse hatalarını ServiceError'a çevirir; diğerlerini olduğu gibi fırlatır. */
export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * JSON dönen bir uç noktayı zaman aşımı ve basit yeniden deneme ile çağırır.
 * - Zaman aşımı → `api` hatası
 * - Ağ hatası (bağlantı yok) → `offline` hatası
 * - HTTP hata kodu → `api` hatası
 */
export async function fetchJson<T>(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  attempts: number = MAX_ATTEMPTS
): Promise<T> {
  let lastError: ServiceError | undefined;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        lastError = new ServiceError('api', `Sunucu hatası (${response.status}).`);
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (isAbortError(error)) {
        lastError = new ServiceError('api', 'İstek zaman aşımına uğradı.');
      } else {
        lastError = new ServiceError('offline', 'İnternet bağlantısı kurulamadı.');
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new ServiceError('api', 'Bilinmeyen bir hata oluştu.');
}
