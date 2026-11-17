import {
  CloudRain,
  Drop,
  Info,
  Lightbulb,
  MoonStars,
  Snowflake,
  Stack,
  Sun,
  ThermometerCold,
  ThermometerHot,
  Umbrella,
  Wind,
  type Icon,
} from 'phosphor-react-native';

import { t } from '@/i18n';

/**
 * Uyarı metni → ikon eşlemesi (saf fonksiyon; `WarningChips` ve
 * Bugün ekranındaki çipler ortak kullanır).
 * Metinler i18n'den geldiği için her iki dilde de `t()` ile karşılaştırılır.
 */
const WARNING_ICONS: readonly { key: string; icon: Icon }[] = [
  { key: 'outfit.umbrella', icon: Umbrella },
  { key: 'outfit.rainGear', icon: CloudRain },
  { key: 'outfit.snow', icon: Snowflake },
  { key: 'outfit.wind', icon: Wind },
  { key: 'outfit.sun', icon: Sun },
  { key: 'outfit.humid', icon: Drop },
  { key: 'outfit.hotNote', icon: ThermometerHot },
  { key: 'outfit.coldNote', icon: ThermometerCold },
  { key: 'outfit.layers', icon: Stack },
  { key: 'outfit.eveningTurn', icon: MoonStars },
  { key: 'outfit.eveningRain', icon: CloudRain },
  { key: 'outfit.dailyNote', icon: Lightbulb },
];

export function warningIcon(warning: string): Icon {
  for (const entry of WARNING_ICONS) {
    if (warning === t(entry.key)) return entry.icon;
  }
  return Info;
}
