import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hexToRgba, skyPalette } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import type { IllustrationKind } from '@/types';

interface ScreenBackgroundProps {
  children: ReactNode;
  /** Hava grubu (görsel türü) — palet ailesini belirler. */
  kind?: IllustrationKind;
}

const ORB_SIZE = 340;
const SCRIM_EXTRA = 8;

/** Tek bir yavaşça süzülen ışık küresi. */
function Orb({
  color,
  size,
  drift,
  delay,
  reduceMotion,
  orbOpacity = 0.2,
}: {
  color: string;
  size: number;
  drift: { x: number; y: number };
  delay: number;
  reduceMotion: boolean;
  orbOpacity?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      progress.value = withRepeat(withTiming(1, { duration: 9000 }), -1, true);
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, reduceMotion, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * drift.x },
      { translateY: progress.value * drift.y },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: orbOpacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Tam ekran zemin: hava + gün/gece gradyanı, 3 yumuşak ışık küresi
 * ve üstte durum çubuğu scrim'i (içerik kayarken saat okunur kalır).
 */
export function ScreenBackground({
  children,
  kind = 'cloudy',
}: ScreenBackgroundProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  // Açık tema her zaman gündüz, koyu tema her zaman gece paleti kullanır;
  // hava durumu yalnızca palet ailesini (güneşli/yağmur/kar/sis) seçer.
  // Böylece açık temada gece havası koyu zemin, koyu temada gündüz açık zemin üretmez.
  const palette = skyPalette(kind, !theme.isDark);
  // Palet değişiminde 600ms fade-in: altta zemin rengi kalır.

  const scrimColors: readonly [string, string] = [
    hexToRgba(palette.colors[0], theme.isDark ? 0.82 : 0.72),
    hexToRgba(palette.colors[0], 0),
  ];

  return (
    <View style={[styles.fill, { backgroundColor: palette.colors[1] }]}>
      <Animated.View
        key={palette.id}
        entering={FadeIn.duration(600)}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={palette.colors}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Işık küreleri — açık temada daha belirgin */}
      <View style={styles.orbLayer} pointerEvents="none">
        <Orb color={palette.orbs[0]} size={ORB_SIZE} drift={{ x: 60, y: -40 }} delay={0} reduceMotion={reduceMotion} orbOpacity={theme.isDark ? 0.2 : 0.38} />
        <Orb color={palette.orbs[1]} size={ORB_SIZE * 0.8} drift={{ x: -70, y: 50 }} delay={1200} reduceMotion={reduceMotion} orbOpacity={theme.isDark ? 0.18 : 0.34} />
        <Orb color={palette.orbs[2]} size={ORB_SIZE * 0.65} drift={{ x: 40, y: 60 }} delay={2400} reduceMotion={reduceMotion} orbOpacity={theme.isDark ? 0.16 : 0.3} />
      </View>

      {children}

      {/* Durum çubuğu scrim'i: içerik üstüne binse de saat okunur. */}
      <View
        pointerEvents="none"
        style={[styles.scrim, { height: insets.top + SCRIM_EXTRA }]}
      >
        <LinearGradient colors={scrimColors} style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  orbLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    top: -ORB_SIZE * 0.35,
    left: -ORB_SIZE * 0.25,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
