import {
  CoatHanger,
  Hand,
  Infinity as Inf,
  Sneaker,
} from 'phosphor-react-native';

import { CoatIcon } from '@/components/CoatIcon';
import { requireGarment } from '@/logic/garmentCatalog';
import { CATEGORY_ICON, garmentIcon } from '@/logic/itemIcons';
import { groupOutfitItems, joinGarmentNames, uniqueLines } from '@/logic/outfitGrouping';
import type { Garment } from '@/types';

describe('groupOutfitItems', () => {
  it('top/base/mid öğelerini tek "Üst" satırında birleştirir', () => {
    const items = [requireGarment('termal-ust'), requireGarment('kazak'), requireGarment('kalin-pantolon')];
    const groups = groupOutfitItems(items);
    const top = groups.find((group) => group.key === 'top');
    expect(top?.items.map((item) => item.id)).toEqual(['termal-ust', 'kazak']);
    expect(top?.labelKey).toBe('cat.top');
    expect(joinGarmentNames(top!)).toBe('Termal + Kazak');
  });

  it('kategori sırasını ilk görülmeye göre korur', () => {
    const items = [
      requireGarment('kalin-mont'),
      requireGarment('termal-ust'),
      requireGarment('kazak'),
      requireGarment('kalin-pantolon'),
      requireGarment('bot'),
      requireGarment('bere'),
      requireGarment('atki'),
    ];
    const groups = groupOutfitItems(items);
    expect(groups.map((group) => group.key)).toEqual(['outer', 'top', 'bottom', 'shoes', 'accessory']);
  });

  it('aksesuar adlarını virgülle birleştirir', () => {
    const group = groupOutfitItems([requireGarment('bere'), requireGarment('atki')]).find(
      (item) => item.key === 'accessory'
    )!;
    expect(joinGarmentNames(group)).toBe('Bere, Atkı');
  });

  it('base-bottom öğesini "Alt" grubuna alır', () => {
    const groups = groupOutfitItems([requireGarment('termal-alt')]);
    expect(groups[0]?.key).toBe('bottom');
  });
});

describe('garmentIcon eşlemesi (itemIcons)', () => {
  it('atkı atkı benzeri ikon alır, ceket/askı/el değil', () => {
    const atki = garmentIcon(requireGarment('atki'));
    expect(atki).toBe(Inf);
    expect(atki).not.toBe(CoatHanger);
    expect(atki).not.toBe(Hand);
  });

  it('mont mont ailesi ikonuna düşer', () => {
    for (const id of ['mont', 'kalin-mont', 'cok-kalin-mont', 'su-gecirmez-mont', 'ince-ceket']) {
      expect(garmentIcon(requireGarment(id))).toBe(CoatIcon);
    }
  });

  it('bilinmeyen öğe kategori ikonuna düşer', () => {
    const fake: Garment = { id: 'bilinmeyen', label: 'X', category: 'shoes', warmth: 0, waterproof: false, windproof: false };
    expect(garmentIcon(fake)).toBe(CATEGORY_ICON.shoes);
    expect(garmentIcon(fake)).toBe(Sneaker);
  });
});

describe('uniqueLines', () => {
  it('tekrar eden satırları tekilleştirir', () => {
    expect(uniqueLines(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  });
});
