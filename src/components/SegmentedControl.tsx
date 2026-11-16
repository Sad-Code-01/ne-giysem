import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** İki seçenek: aktif olan ana dolgu, metin zemin rengi. */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();

  const handlePress = (next: T): void => {
    if (next === value) return;
    void Haptics.selectionAsync().catch(() => undefined);
    onChange(next);
  };

  return (
    <View style={[styles.track, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => handlePress(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={[styles.segment, active && { backgroundColor: theme.primary }]}
          >
            <Text
              style={[typography.caption, { color: active ? theme.onPrimary : theme.textSecondary }]}
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
    borderWidth: BORDER_WIDTH,
    padding: 3,
    gap: 2,
  },
  segment: {
    minHeight: 36,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
