import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDailyReminder } from '@/hooks/useDailyReminder';
import { ProfileProvider } from '@/hooks/useProfile';
import { useWeatherContext, WeatherProvider } from '@/hooks/useWeatherContext';
import { isConsentValid } from '@/logic/consent';
import { getConsent } from '@/storage/consent';
import { getOnboardingDone } from '@/storage/cache';
import { useAppTheme } from '@/theme/useAppTheme';

type Gate = 'loading' | 'onboarding' | 'app';

/** Hava verisi hazır olduğunda günlük hatırlatmayı planlar. */
function ReminderScheduler() {
  const { snapshot } = useWeatherContext();
  useDailyReminder(snapshot);
  return null;
}

/** Onay/karşılama eksikse karşılama ekranına yönlendirir. */
function OnboardingRedirect({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (active) router.replace('/karsilama');
  }, [active, router]);
  return null;
}

/**
 * Kök yönlendirici: font + onay/karşılama kapısı → (tabs) + karsilama +
 * sehir-ara modalı + ayarlar alt ekranları.
 * Fontlar ve kapı çözülmeden splash kapanmaz (titreme yok).
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [gate, setGate] = useState<Gate>('loading');
  const theme = useAppTheme();

  // Fontlar yüklenene kadar native splash açık kalır.
  useEffect(() => {
    void SplashScreen.preventAutoHideAsync();
  }, []);

  // Onay + karşılama durumu: ikisi de tamamsa ana akış, değilse karşılama.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([getConsent(), getOnboardingDone()]).then(([consent, done]) => {
      if (cancelled) return;
      setGate(isConsentValid(consent) && done ? 'app' : 'onboarding');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fontsReady = fontsLoaded || fontError != null;
  const ready = fontsReady && gate !== 'loading';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <WeatherProvider>
          <ReminderScheduler />
          <OnboardingRedirect active={gate === 'onboarding'} />
          <StatusBar style={theme.isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="karsilama" />
            <Stack.Screen name="ayarlar/usume" />
            <Stack.Screen name="ayarlar/konumlar" />
            <Stack.Screen name="ayarlar/bildirimler" />
            <Stack.Screen
              name="sehir-ara"
              options={{
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </WeatherProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
