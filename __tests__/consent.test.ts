import {
  CONSENT_VERSION,
  isConsentValid,
  needsConsent,
  parseConsentRecord,
} from '@/logic/consent';

describe('consent state machine', () => {
  it('onay yoksa devam edilemez', () => {
    expect(needsConsent(null)).toBe(true);
    expect(needsConsent(undefined)).toBe(true);
  });

  it('geçerli onay kaydı devam ettirir', () => {
    const record = { version: CONSENT_VERSION, acceptedAt: 1700000000000 };
    expect(isConsentValid(record)).toBe(true);
    expect(needsConsent(record)).toBe(false);
  });

  it('sürüm eskiyse yeniden onay ister', () => {
    const old = { version: CONSENT_VERSION - 1, acceptedAt: 1700000000000 };
    expect(isConsentValid(old)).toBe(false);
    expect(needsConsent(old)).toBe(true);
  });

  it('bozuk kayıtları reddeder', () => {
    expect(parseConsentRecord(null)).toBeNull();
    expect(parseConsentRecord('string')).toBeNull();
    expect(parseConsentRecord({})).toBeNull();
    expect(parseConsentRecord({ version: '1', acceptedAt: 1 })).toBeNull();
    expect(parseConsentRecord({ version: CONSENT_VERSION, acceptedAt: 'x' })).toBeNull();
    expect(parseConsentRecord({ version: CONSENT_VERSION + 5, acceptedAt: 1 })).toBeNull();
  });

  it('parseConsentRecord geçerli kaydı olduğu gibi döndürür', () => {
    const raw = { version: CONSENT_VERSION, acceptedAt: 42 };
    expect(parseConsentRecord(raw)).toEqual(raw);
  });
});
