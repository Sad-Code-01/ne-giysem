import 'expo-router/entry';

// Widget native modülü yalnızca dev/production build'de var; Expo Go'da yok.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerWidgetTaskHandler } = require('react-native-android-widget') as typeof import('react-native-android-widget');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { widgetTaskHandler } = require('@/widgets/taskHandler') as typeof import('@/widgets/taskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
} catch {
  // Native modül yoksa (Expo Go / web) widget kaydı atlanır.
}
