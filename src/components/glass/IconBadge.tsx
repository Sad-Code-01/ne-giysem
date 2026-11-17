import type { Icon } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { glassMaterial } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';

interface IconBadgeProps {
  icon: Icon;
  /** İkon boyutu (varsayılan 18). */
  size?: number;
  /** Rozet kenarı (varsayılan 36). */
  boxSize?: number;
  /** İkon rengi (varsayılan: ana vurgu). */
  color?: string;
}

/** İnce cam halkalı ikon rozeti — kalın çerçeve yok. */
export function IconBadge({ icon: IconComponent, size = 18, boxSize = 36, color }: IconBadgeProps) {
  const theme = useAppTheme();
  const material = glassMaterial(theme, 'chip');
  return (
    <View
      style={[
        styles.badge,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: boxSize / 2,
          backgroundColor: material.fill,
          borderColor: material.border,
        },
      ]}
    >
      <IconComponent size={size} color={color ?? theme.tabActive} weight="regular" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
