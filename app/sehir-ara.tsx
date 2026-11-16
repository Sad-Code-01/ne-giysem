import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { CitySearchSheet } from '@/components/CitySearchSheet';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';

/**
 * Şehir arama modal rotası (Yönerge 7.7):
 * - Kök seviyede çizilir; hiçbir kartın içinde render edilmez.
 * - Opak sheet + rgba(0,0,0,0.45) scrim; arkadaki içerik görünmez.
 * - Perdeye 1. dokunuş klavyeyi kapatır, 2. dokunuş sheet'i kapatır.
 */
export default function CitySearchRoute() {
  const theme = useAppTheme();
  const router = useRouter();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleScrimPress = (): void => {
    if (keyboardVisible) {
      Keyboard.dismiss();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
        onPress={handleScrimPress}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
      />
      <CitySearchSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
