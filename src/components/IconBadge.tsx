import type { Icon } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

interface IconBadgeProps {
  icon: Icon;
  /** İkon boyutu (varsayılan 18). */
  size?: number;
  /** Rozet kenarı (varsayılan 32). */
  boxSize?: number;
  /** İkon rengi (varsayılan: ikincil metin). */
  color?: string;
}

/** Ayar satırları için 32×32 yuvarlak kare ikon rozeti. */
export function IconBadge({ icon: IconComponent, size = 18, boxSize = 32, color }: IconBadgeProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.badge,
        { width: boxSize, height: boxSize, borderRadius: boxSize * 0.3, backgroundColor: theme.surface },
      ]}
    >
      <IconComponent size={size} color={color ?? theme.textSecondary} weight="regular" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
