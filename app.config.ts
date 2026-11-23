import type { ExpoConfig } from 'expo/config';
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: 'Mini',
      label: 'Ne Giysem? (Mini)',
      description: '2×1 mini hava ve sıcaklık widget’ı',
      minWidth: '110dp',
      minHeight: '56dp',
      targetCellWidth: 2,
      targetCellHeight: 1,
      resizeMode: 'horizontal|vertical',
      updatePeriodMillis: 1_800_000,
    },
    {
      name: 'Kucuk',
      label: 'Ne Giysem? (Küçük)',
      description: 'Küçük hava ve kıyafet önerisi widget’ı',
      minWidth: '180dp',
      minHeight: '110dp',
      targetCellWidth: 3,
      targetCellHeight: 2,
      resizeMode: 'horizontal|vertical',
      updatePeriodMillis: 1_800_000,
    },
    {
      name: 'Orta',
      label: 'Ne Giysem? (Orta)',
      description: 'Hava durumu, kıyafet önerisi ve 4 saatlik şerit',
      minWidth: '280dp',
      minHeight: '120dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      resizeMode: 'horizontal|vertical',
      updatePeriodMillis: 1_800_000,
    },
  ],
};

/**
 * Uygulama yapılandırması.
 * Not: Gizli anahtar gerekmez (Open-Meteo anahtarsız çalışır), bu yüzden .env kullanılmıyor.
 */
const config: ExpoConfig = {
  name: 'Ne Giysem?',
  slug: 'ne-giysem',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'negiysem',
  icon: './assets/favicon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.sadcode.negiysem',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Bulunduğun yerdeki hava durumunu gösterip bugün ne giymen gerektiğini söyleyebilmemiz için konumuna ihtiyacımız var.',
    },
  },
  android: {
    package: 'com.sadcode.negiysem',
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      // foreground: assets/favicon.png (512×512 — güvenli bölgeye dikkat)
      // backgroundImage/monochromeImage yoksa backgroundColor kullanılır.
      foregroundImage: './assets/favicon.png',
      backgroundColor: '#E6F4FE',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-status-bar',
    'expo-web-browser',
    'expo-notifications',
    ['react-native-android-widget', widgetConfig],
    [
      'expo-splash-screen',
      {
        image: './assets/favicon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#F1F0EA',
        dark: {
          backgroundColor: '#121A17',
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Bulunduğun yerdeki hava durumunu gösterip bugün ne giymen gerektiğini söyleyebilmemiz için konumuna ihtiyacımız var.',
      },
    ],
    
  ],
   experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '34632a48-b68c-4505-a7f7-da642b92efd1',
    },
  },
};

export default config;