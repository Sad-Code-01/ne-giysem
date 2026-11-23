import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Yükleme: logo + nabız + kısa açıklama. Boş ekran yerine marka hissi verir. */
export function LoadingView() {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(0.6, { duration: 800 }), -1, true);
  }, [pulse, reduceMotion]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('../../assets/favicon.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Animated.View>
      <Text style={[typography.caption, { color: theme.textSecondary }]}>
        {t('loading.weather')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  logo: {
    width: 84,
    height: 84,
  },
});
