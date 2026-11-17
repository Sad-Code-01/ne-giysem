import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { glassMaterial } from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/spacing';

interface SolidSheetProps {
  children: ReactNode;
  topPadding?: number;
}

/**
 * Cam alt sheet: blur + opak cam dolgu, 28 köşe, tutma çubuğu.
 * Klavye açılınca sheet klavyenin üstünde kalır (Android'de de).
 */
export function SolidSheet({ children, topPadding = spacing.lg }: SolidSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const material = glassMaterial(theme, 'sheet');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Klavye açıkken sheet'in üst sınırı: kalan alanı aşarsa başlık ve
  // arama kutusu ekran dışında kalır. Klavye yüksekliğine göre sınırla.
  const sheetMaxHeight =
    keyboardHeight > 0
      ? Math.max(260, windowHeight - keyboardHeight - insets.top - spacing.lg)
      : '88%';

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
            backgroundColor: material.fallbackFill,
            borderColor: material.border,
            paddingTop: topPadding,
            paddingBottom: insets.bottom + spacing.md,
            // Klavye açıkken sheet'i klavyenin üstüne kaldır.
            // iOS'ta KeyboardAvoidingView padding halleder; Android modal
            // penceresi resize olmadığı için manuel kaldırma gerekir.
            marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
            maxHeight: sheetMaxHeight,
          },
        ]}
      >
        {Platform.OS !== 'android' ? (
          <BlurView
            intensity={50}
            tint={theme.isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={styles.handleWrap} pointerEvents="none">
          <View style={[styles.handle, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(20,40,70,0.2)' }]} />
        </View>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flexShrink: 1,
  },
});
