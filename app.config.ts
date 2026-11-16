import type { ExpoConfig } from 'expo/config';

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
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.sadik.negiysem',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Bulunduğun yerdeki hava durumunu gösterip bugün ne giymen gerektiğini söyleyebilmemiz için konumuna ihtiyacımız var.',
    },
  },
  android: {
    package: 'com.sadik.negiysem',
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
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
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
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