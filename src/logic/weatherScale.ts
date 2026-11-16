import { OUTFIT_THRESHOLDS } from '@/constants/config';
import { t } from '@/i18n';
import { COLD_SENSITIVITY_OFFSET, profileOffsetOf } from '@/logic/effectiveTemp';
import { meanPast14 } from '@/logic/slots';
import type { OutfitProfile, WeatherSnapshot } from '@/types';

/**
 * Hava ölçeği (Yönerge 6.11): bant eşiklerini gerçek sıcaklığa çevirir.
 * `totalOffset = profileOffset + learnedOffset + acclimation` (ulaşım cezası gösterilmez).
 */

export interface WeatherScaleRanges {
  /** Tişört havası: effective ≥18 → "{18−offset}° ve üstü". */
  tshirt: { min: number; label: string };
  /** Ceket havası: 12≤eff<18 → "{12−offset}° ile {18−offset}° arası". */
  jacket: { min: number; max: number; label: string };
  /** Mont havası: eff<12 → "{12−offset}° altı". */
  coat: { max: number; label: string };
  /** Bugün çıkma: sabit metin. */
  avoid: string;
}

function roundTemp(value: number): number {
  return Math.round(value);
}

/**
 * Profil + (opsiyonel) snapshot'tan iklim alışması hesaplayıp aralıkları üretir.
 * `snapshot` yoksa `mean14 = 15` varsayılır (alışma ofseti 0).
 */
export function computeWeatherScale(
  profile: OutfitProfile,
  snapshot?: WeatherSnapshot | null
): WeatherScaleRanges {
  const mean14 = snapshot ? meanPast14(snapshot) : OUTFIT_THRESHOLDS.acclimationReferenceTemp;
  const acclimation = Math.min(
    OUTFIT_THRESHOLDS.acclimationMax,
    Math.max(
      OUTFIT_THRESHOLDS.acclimationMin,
      (OUTFIT_THRESHOLDS.acclimationReferenceTemp - mean14) *
        OUTFIT_THRESHOLDS.acclimationFactor
    )
  );
  const totalOffset =
    profileOffsetOf(profile) + profile.learnedOffset + acclimation;

  const tshirtMin = roundTemp(18 - totalOffset);
  const jacketMin = roundTemp(12 - totalOffset);
  const jacketMax = roundTemp(18 - totalOffset);
  const coatMax = roundTemp(12 - totalOffset);

  return {
    tshirt: { min: tshirtMin, label: t('scale.tshirt', { min: tshirtMin }) },
    jacket: {
      min: jacketMin,
      max: jacketMax,
      label: t('scale.jacket', { min: jacketMin, max: jacketMax }),
    },
    coat: { max: coatMax, label: t('scale.coat', { max: coatMax }) },
    avoid: t('scale.avoid'),
  };
}

/** Üşüme hassasiyeti → profil ofseti (dışa aktarım için). */
export { COLD_SENSITIVITY_OFFSET };
