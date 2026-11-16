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
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { t } from '@/i18n';
import { spacing } from '@/theme/spacing';

/**
 * Uyarı metni → ikon eşlemesi. Metinler i18n'den geldiği için
 * her iki dilde de `t()` ile karşılaştırılır; eşleşme yoksa Info.
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

function iconFor(warning: string): Icon {
  for (const entry of WARNING_ICONS) {
    if (warning === t(entry.key)) return entry.icon;
  }
  return Info;
}

interface WarningChipsProps {
  warnings: string[];
}

/** Uyarıları yatay sarılan amber çipler olarak gösterir. */
export function WarningChips({ warnings }: WarningChipsProps) {
  if (warnings.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {warnings.map((warning) => (
        <Chip key={warning} label={warning} icon={iconFor(warning)} tone="amber" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
