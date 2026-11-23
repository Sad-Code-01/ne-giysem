import { applyFeedbackToOffset } from '@/logic/feedback';
import { OUTFIT_THRESHOLDS } from '@/constants/config';

describe('applyFeedbackToOffset', () => {
  it('üşüdüm ofseti küçültür (daha kalın giy)', () => {
    expect(applyFeedbackToOffset(0, 'cold')).toBe(-0.25);
    expect(applyFeedbackToOffset(1, 'cold')).toBe(0.75);
  });

  it('sıcakladım ofseti büyütür (daha ince giy)', () => {
    expect(applyFeedbackToOffset(0, 'hot')).toBe(0.25);
    expect(applyFeedbackToOffset(-1, 'hot')).toBe(-0.75);
  });

  it('tam isabet ofseti sıfıra doğru çeker', () => {
    const next = applyFeedbackToOffset(-2, 'perfect');
    expect(next).toBeGreaterThan(-2);
    expect(next).toBeLessThan(0);
    expect(applyFeedbackToOffset(0, 'perfect')).toBe(0);
  });

  it('yağmur/tercih geri bildirimi ofseti değiştirmez', () => {
    expect(applyFeedbackToOffset(0.5, 'rain')).toBe(0.5);
    expect(applyFeedbackToOffset(-0.5, 'dislike')).toBe(-0.5);
  });

  it('sınırları aşmaz (±3)', () => {
    expect(applyFeedbackToOffset(OUTFIT_THRESHOLDS.learnedOffsetMax, 'hot')).toBe(
      OUTFIT_THRESHOLDS.learnedOffsetMax
    );
    expect(applyFeedbackToOffset(OUTFIT_THRESHOLDS.learnedOffsetMin, 'cold')).toBe(
      OUTFIT_THRESHOLDS.learnedOffsetMin
    );
  });
});
