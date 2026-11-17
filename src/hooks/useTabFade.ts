import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Sekme odağı her kazanıldığında içeriği 200 ms'de soldurur.
 * Remount olmadığı için kaydırma konumu korunur.
 * Kullanım: `<Animated.View style={[{ flex: 1 }, fadeStyle]}>…</Animated.View>`
 */
export function useTabFade() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const [focusTick, setFocusTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusTick((tick) => tick + 1);
      return undefined;
    }, [])
  );

  useEffect(() => {
    opacity.value = reduceMotion ? 1 : withTiming(1, { duration: 340 });
  }, [focusTick, reduceMotion, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return fadeStyle;
}
