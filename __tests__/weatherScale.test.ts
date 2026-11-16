import { computeWeatherScale } from '@/logic/weatherScale';
import { makeSnapshot } from './helpers';
import type { OutfitProfile } from '@/types';

const base: OutfitProfile = { coldSensitivity: 'normal', transport: 'walk', learnedOffset: 0 };

describe('computeWeatherScale (6.11)', () => {
  it('normal profil, mean14=15 → ofset 0, eşikler aynen', () => {
    const scale = computeWeatherScale(base, makeSnapshot());
    expect(scale.tshirt.label).toBe('18° ve üstü');
    expect(scale.jacket.label).toBe('12° ile 18° arası');
    expect(scale.coat.label).toBe('12° altı');
    expect(scale.avoid).toBe('Fırtına, yoğun kar, aşırı soğuk');
  });

  it('üşüme hassasiyeti aralıkları kaydırır', () => {
    // very: profileOffset -3 → tişört eşiği 18-(-3)=21
    const cold = computeWeatherScale({ ...base, coldSensitivity: 'very' });
    expect(cold.tshirt.label).toBe('21° ve üstü');
    expect(cold.jacket.label).toBe('15° ile 21° arası');
    expect(cold.coat.label).toBe('15° altı');

    // none: +3 → tişört 15°+
    const warm = computeWeatherScale({ ...base, coldSensitivity: 'none' });
    expect(warm.tshirt.label).toBe('15° ve üstü');
  });

  it('öğrenme ofseti aralıkları kaydırır', () => {
    const learned = computeWeatherScale({ ...base, learnedOffset: -2 });
    expect(learned.tshirt.label).toBe('20° ve üstü');
  });

  it('iklim alışması snapshot mean14 ile hesaplanır', () => {
    // mean14=5 → (15-5)*0.15=1.5 → tişört 18-1.5=16.5→17 (yuvarlanır)
    const snapshot = makeSnapshot();
    snapshot.daily = snapshot.daily.map((d) =>
      d.isPast ? { ...d, temperatureMean: 5 } : d
    );
    const scale = computeWeatherScale(base, snapshot);
    expect(scale.tshirt.label).toBe('17° ve üstü');
  });

  it('snapshot yoksa mean14=15 varsayılır (alışma 0)', () => {
    const scale = computeWeatherScale(base, null);
    expect(scale.tshirt.label).toBe('18° ve üstü');
  });
});
