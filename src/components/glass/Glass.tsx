import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassMaterial, type GlassVariant } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius } from '@/theme/spacing';

const ANDROID_BLUR_METHOD =
  Platform.OS === 'android'
    ? Platform.Version >= 31
      ? 'dimezisBlurViewSdk31Plus'
      : 'dimezisBlurView'
    : undefined;

interface GlassProps {
  children: ReactNode;
  variant?: GlassVariant;
  /** Gerçek blur (yalnızca hero/sheet gibi sınırlı yüzeylerde). */
  blur?: boolean;
  blurIntensity?: number;
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** padding'siz sarma (liste grubu gibi). */
  padded?: boolean;
  padding?: number;
}

/**
 * Tek cam yüzey. `blur` kapalıyken yarı saydam dolgu + kenarlık +
 * üst parlak çizgi + yumuşak gölge; blur açıkken aynı malzemenin
 * üstüne BlurView eklenir (arka plan yumuşak gradyan olduğu için
 * kartlar blur'suz da aynı görünür).
 */
export function Glass({
  children,
  variant = 'surface',
  blur = false,
  blurIntensity = 40,
  cornerRadius = radius.card,
  style,
  contentStyle,
  padded = true,
  padding = 16,
}: GlassProps) {
  const theme = useAppTheme();
  const material = glassMaterial(theme, variant);
  const isDark = theme.isDark;

  return (
    <View
      style={[
        styles.clip,
        {
          borderRadius: cornerRadius,
          borderColor: material.border,
          backgroundColor: blur ? material.fallbackFill : material.fill,
        },
        material.shadow,
        style,
      ]}
    >
      {blur ? (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          blurMethod={ANDROID_BLUR_METHOD}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {/* Üst kenarda ince parlak iç çizgi */}
      <View
        style={[
          styles.topHighlight,
          { backgroundColor: material.highlight },
        ]}
        pointerEvents="none"
      />
      <View style={[padded && { padding }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    borderRadius: 1,
  },
});
