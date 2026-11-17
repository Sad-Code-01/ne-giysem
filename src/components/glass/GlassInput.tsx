import { X, type Icon } from 'phosphor-react-native';
import type { ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { glassMaterial } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing, MIN_TOUCH_SIZE } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface GlassInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: Icon;
  /** Verilirse sağda temizle düğmesi gösterilir (value boşken gizlenir). */
  onClear?: () => void;
  clearLabel?: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<ComponentRef<typeof TextInput>>;
  style?: StyleProp<TextStyle>;
  returnKeyType?: 'search' | 'done' | 'go' | 'next';
  onSubmitEditing?: () => void;
}

/** Tam yuvarlak cam arama/giriş alanı. */
export function GlassInput({
  value,
  onChangeText,
  placeholder,
  icon: IconComponent,
  onClear,
  clearLabel,
  autoFocus,
  inputRef,
  style,
  returnKeyType = 'search',
  onSubmitEditing,
}: GlassInputProps) {
  const theme = useAppTheme();
  const material = glassMaterial(theme, 'input');

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: material.fill,
          borderColor: material.border,
        },
      ]}
    >
      {IconComponent ? (
        <IconComponent size={18} color={theme.textSecondary} weight="regular" />
      ) : null}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        maxFontSizeMultiplier={1.3}
        style={[typography.body, styles.input, { color: theme.text }, style]}
      />
      {onClear && value.length > 0 ? (
        <Pressable
          onPress={onClear}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
        >
          <X size={18} color={theme.textSecondary} weight="regular" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: MIN_TOUCH_SIZE + 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
});
