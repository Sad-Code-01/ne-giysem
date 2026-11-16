import { nextTriggerDate, reminderContent } from '@/logic/notifications';
import { buildDayOutfit } from '@/logic/outfitEngine';
import type { WeatherSnapshot } from '@/types';

jest.mock('@/i18n', () => ({
  t: (key: string) =>
    ({ 'notif.title': 'Ne Giysem?', 'notif.today': 'Bugün', 'notif.tomorrow': 'Yarın' })[key] ?? key,
}));

jest.mock('@/logic/outfitEngine', () => ({
  buildDayOutfit: jest.fn((_snapshot: unknown, _profile: unknown, dayOffset: number) => ({
    title: `outfit-${dayOffset}`,
  })),
}));

const snapshot = { fetchedAt: Date.now() } as unknown as WeatherSnapshot;
const profile = { coldSensitivity: 'normal', transport: 'walk', learnedOffset: 0 } as const;

describe('nextTriggerDate', () => {
  it('saat geçmemişse bugün döner', () => {
    const from = new Date(2025, 0, 10, 8, 0, 0);
    const next = nextTriggerDate(21, 0, from);
    expect(next.getDate()).toBe(10);
    expect(next.getHours()).toBe(21);
    expect(next.getMinutes()).toBe(0);
  });

  it('saat geçmişse yarına kayar', () => {
    const from = new Date(2025, 0, 10, 22, 30, 0);
    const next = nextTriggerDate(21, 0, from);
    expect(next.getDate()).toBe(11);
    expect(next.getHours()).toBe(21);
  });

  it('tam eşitse yarına kayar (tekrar tetiklenmesin)', () => {
    const from = new Date(2025, 0, 10, 21, 0, 0);
    const next = nextTriggerDate(21, 0, from);
    expect(next.getDate()).toBe(11);
  });
});

describe('reminderContent', () => {
  it('akşam → yarının (dayOffset 1) kombinini bildirir', () => {
    const content = reminderContent(snapshot, profile, 'aksam');
    expect(buildDayOutfit).toHaveBeenCalledWith(snapshot, profile, 1);
    expect(content).toEqual({ title: 'Ne Giysem?', body: 'Yarın: outfit-1' });
  });

  it('sabah → bugünün (dayOffset 0) kombinini bildirir', () => {
    const content = reminderContent(snapshot, profile, 'sabah');
    expect(buildDayOutfit).toHaveBeenCalledWith(snapshot, profile, 0);
    expect(content).toEqual({ title: 'Ne Giysem?', body: 'Bugün: outfit-0' });
  });
});
