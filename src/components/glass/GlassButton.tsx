import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { glassMaterial } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing, MIN_TOUCH_SIZE } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Birincil: vurgu gradyanlı cam (accent → sıcak ton).
 * İkincil: cam. Basılınca hafif haptic.
 */
export function GlassButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: GlassButtonProps) {
  const theme = useAppTheme();
  const material = glassMaterial(theme, 'pill');
  const isPrimary = variant === 'primary';

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };

  const gradientColors: readonly [string, string] = theme.isDark
    ? ['#F5B544', '#EE8F1D']
    : ['#F7B84B', '#EE9A26'];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: radius.pill,
          borderColor: isPrimary ? 'transparent' : material.border,
          backgroundColor: isPrimary ? 'transparent' : material.fill,
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        },
        material.shadow,
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Text
        style={[
          typography.titleS,
          { color: isPrimary ? theme.onAccent : theme.text },
        ]}
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_SIZE + 4,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
