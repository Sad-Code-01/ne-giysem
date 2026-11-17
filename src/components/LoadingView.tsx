import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Glass } from '@/components/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/spacing';

/** Yükleme: nabız atan cam iskelet. Sahte veri yok. */
export function LoadingView() {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(0.55, { duration: 700 }), -1, true);
  }, [pulse, reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const bone = theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(120,140,165,0.25)';

  return (
    <Glass style={styles.card}>
      <Animated.View style={shimmerStyle}>
        <View style={[styles.hole, { borderColor: bone }]} />
        <View style={[styles.line, { backgroundColor: bone, width: '70%' }]} />
        <View style={[styles.line, { backgroundColor: bone, width: '46%' }]} />
      </Animated.View>
      <ActivityIndicator color={theme.tabActive} />
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  hole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  line: {
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
});
