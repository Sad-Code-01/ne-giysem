import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  glassIndicatorBorder,
  glassIndicatorFill,
  glassMaterial,
} from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing, MIN_TOUCH_SIZE } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface GlassSegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface GlassSegmentedProps<T extends string | number> {
  options: readonly GlassSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Bugün/Yarım tarzı küçük seçim: cam track + kayan açık iç hap.
 * Gösterge animasyonu sekme çubuğundakiyle aynı (damping 18 / stiffness 220).
 */
export function GlassSegmented<T extends string | number>({
  options,
  value,
  onChange,
}: GlassSegmentedProps<T>) {
  const theme = useAppTheme();
  const material = glassMaterial(theme, 'pill');
  const [trackWidth, setTrackWidth] = useState(0);

  const count = Math.max(options.length, 1);
  const segmentWidth = trackWidth > 0 ? (trackWidth - 8) / count : 0;
  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );

  const translateX = useSharedValue(0);
  const scaleX = useSharedValue(1);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    translateX.value = withSpring(activeIndex * segmentWidth, {
      damping: 18,
      stiffness: 220,
    });
    scaleX.value = withSequence(
      withTiming(1.08, { duration: 120 }),
      withSpring(1, { damping: 18, stiffness: 220 })
    );
  }, [activeIndex, segmentWidth, translateX, scaleX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: translateX.value }, { scaleX: scaleX.value }],
  }));

  const handlePress = (next: T): void => {
    if (next === value) return;
    void Haptics.selectionAsync().catch(() => undefined);
    onChange(next);
  };

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: material.fill,
          borderColor: material.border,
        },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              height: MIN_TOUCH_SIZE - 8,
              borderRadius: radius.pill,
              backgroundColor: glassIndicatorFill(theme),
              borderColor: glassIndicatorBorder(theme),
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => handlePress(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={styles.segment}
          >
            <Text
              style={[
                typography.caption,
                { color: active ? theme.tabActive : theme.textSecondary },
              ]}
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE - 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
