import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, spacing } from '@/theme/spacing';

interface SolidSheetProps {
  children: ReactNode;
  topPadding?: number;
}

/** Opak alt sheet. Blur yok; zemin rengi yüzey. */
export function SolidSheet({ children, topPadding = spacing.lg }: SolidSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
            paddingTop: topPadding,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.line }]} />
        <View style={styles.content}>{children}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    borderBottomWidth: 0,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
    opacity: 0.45,
  },
  content: {
    flexShrink: 1,
  },
});
