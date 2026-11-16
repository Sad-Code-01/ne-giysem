import { MapPin, Trash } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SettingsHeader } from '@/components/SettingsHeader';
import { SolidButton } from '@/components/SolidButton';
import { useProfile } from '@/hooks/useProfile';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { t } from '@/i18n';
import { getCurrentPlace, requestLocationPermission } from '@/services/locationService';
import { useAppTheme } from '@/theme/useAppTheme';
import { MIN_TOUCH_SIZE, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Place } from '@/types';

/** Kayıtlı şehirler: liste + sil + ekle + mevcut konum. */
export default function CitiesScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, addCity, removeCity } = useProfile();
  const { selectPlace } = useWeatherContext();
  const [busy, setBusy] = useState(false);

  const addCurrentLocation = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) return;
      const place = await getCurrentPlace();
      await addCity(place);
      await selectPlace(place);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const select = async (place: Place): Promise<void> => {
    await selectPlace(place);
    router.back();
  };

  return (
    <ScreenBackground kind="partly" isDay>
      <SettingsHeader title={t('settings.citiesTitle')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <SolidButton
          label={t('welcome.useLocation')}
          variant="secondary"
          onPress={() => void addCurrentLocation()}
          disabled={busy}
        />
        <SolidButton
          label={t('settings.citiesAdd')}
          onPress={() => router.push('/sehir-ara')}
          disabled={busy}
        />

        {profile.cities.length === 0 ? (
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            {t('settings.citiesEmpty')}
          </Text>
        ) : (
          <GlassCard contentStyle={styles.group}>
            {profile.cities.map((city, index) => (
              <View key={`${city.name}-${city.latitude}-${city.longitude}`}>
                {index > 0 ? <View style={styles.hairline} /> : null}
                <View style={styles.row}>
                  <Pressable
                    onPress={() => void select(city)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <MapPin size={18} color={theme.primary} weight="regular" />
                    <View style={styles.rowText}>
                      <Text style={[typography.body, { color: theme.text }]} numberOfLines={1}>
                        {city.name}
                      </Text>
                      {city.region && city.region !== city.name ? (
                        <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                          {city.region}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                      void removeCity(city);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('common.delete')} ${city.name}`}
                    style={styles.delete}
                  >
                    <Trash size={20} color={theme.textSecondary} weight="regular" />
                  </Pressable>
                </View>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  group: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE + 8,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
  },
  rowText: {
    flexShrink: 1,
  },
  delete: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hairline: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginLeft: 44,
  },
});
