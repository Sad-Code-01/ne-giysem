import { CaretDown, Check, Globe, MagnifyingGlass, MapPin, X } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SolidSheet } from '@/components/SolidSheet';
import { SheetModal } from '@/components/SheetModal';
import { Glass, GlassInput } from '@/components/glass';
import { countryOptions } from '@/constants/countries';
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from '@/constants/config';
import { useProfile } from '@/hooks/useProfile';
import { locale, t } from '@/i18n';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { searchCities } from '@/services/geocodingService';
import { useAppTheme } from '@/theme/useAppTheme';
import { MIN_TOUCH_SIZE, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Place } from '@/types';

/**
 * Şehir arama içeriği — `app/sehir-ara.tsx` modal rotası tarafından çizilir.
 * Cam SolidSheet (klavye üstünde kalır), 400ms debounce, istek iptali.
 */
export function CitySearchSheet() {
  const theme = useAppTheme();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromOnboarding = from === 'onboarding';
  const { selectPlace } = useWeatherContext();
  const { addCity } = useProfile();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Ülke süzgeci: varsayılan Türkiye; null → tüm ülkeler.
  const [countryCode, setCountryCode] = useState<string | null>('TR');
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const requestIdRef = useRef(0);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const countries = countryOptions(locale());
  const selectedCountry =
    countries.find((country) => country.code === countryCode) ?? countries[0];

  const trimmed = query.trim();
  const isQueryReady = trimmed.length >= MIN_SEARCH_LENGTH;

  // Açılış animasyonu bittikten sonra klavyeyi aç.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const resetSearch = (): void => {
    requestIdRef.current += 1;
    setQuery('');
    setResults([]);
    setErrorMessage(null);
    setIsSearching(false);
  };

  const handleChangeText = (text: string): void => {
    setQuery(text);
    setErrorMessage(null);
    setIsSearching(text.trim().length >= MIN_SEARCH_LENGTH);
  };

  /** Aramayı hemen çalıştırır; istek kimliği eski sonuçları geçersiz kılar. */
  const runSearch = (text: string): void => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    searchCities(text, countryCode)
      .then((places) => {
        if (requestId !== requestIdRef.current) return;
        setResults(places);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setErrorMessage(t('search.error'));
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsSearching(false);
      });
  };

  // Geciktirilmiş arama (debounce) + eski istekleri iptal et.
  // Ülke değişince de yeniden ara.
  useEffect(() => {
    if (trimmed.length < MIN_SEARCH_LENGTH) return;

    const timer = setTimeout(() => runSearch(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, countryCode]);

  const handleSubmit = (): void => {
    // Klavye önerisi/boşluk sonrası debounce beklemeden hemen ara.
    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      runSearch(trimmed);
    }
  };

  const handleClose = (): void => {
    resetSearch();
    Keyboard.dismiss();
    router.back();
  };

  const handleSelect = (place: Place): void => {
    void Haptics.selectionAsync().catch(() => undefined);
    Keyboard.dismiss();
    resetSearch();
    void selectPlace(place);
    void addCity(place);
    // Karşılama akışından açıldıysa yalnızca sheet'i kapat —AsyncStorage
    // okuması beklemeden deterministik geri dönüş (boş sayfa takılması yok).
    // Kurulum tamamlandıysa doğrudan ana ekrana geç.
    if (fromOnboarding) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/karsilama');
      }
    } else {
      router.dismissTo('/');
    }
  };

  let body: ReactNode;
  if (isSearching) {
    body = (
      <View style={styles.state}>
        <ActivityIndicator color={theme.tabActive} />
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.4}>
          {t('search.loading')}
        </Text>
      </View>
    );
  } else if (errorMessage) {
    body = (
      <View style={styles.state}>
        <Text
          style={[typography.body, styles.center, { color: theme.textSecondary }]}
          maxFontSizeMultiplier={1.4}
        >
          {errorMessage}
        </Text>
      </View>
    );
  } else if (!isQueryReady) {
    body = (
      <View style={styles.state}>
        <Text
          style={[typography.body, styles.center, { color: theme.textSecondary }]}
          maxFontSizeMultiplier={1.4}
        >
          {t('search.minChars', { count: MIN_SEARCH_LENGTH })}
        </Text>
      </View>
    );
  } else if (results.length === 0) {
    body = (
      <View style={styles.state}>
        <Text
          style={[typography.body, styles.center, { color: theme.textSecondary }]}
          maxFontSizeMultiplier={1.4}
        >
          {t('search.empty')}
        </Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={results}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => `${item.name}-${item.latitude}-${item.longitude}`}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: 'rgba(120,140,165,0.25)' }]} />
        )}
        renderItem={({ item }) => {
          const secondary = item.region || item.country;
          return (
            <Pressable
              onPress={() => handleSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={secondary ? `${item.name}, ${secondary}` : item.name}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Glass variant="chip" cornerRadius={radius.pill} padded={false} contentStyle={styles.rowBadge}>
                <MapPin size={16} color={theme.tabActive} weight="regular" />
              </Glass>
              <View style={styles.rowText}>
                <Text
                  style={[typography.body, { color: theme.text }]}
                  maxFontSizeMultiplier={1.3}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {secondary ? (
                  <Text
                    style={[typography.caption, { color: theme.textSecondary }]}
                    maxFontSizeMultiplier={1.3}
                    numberOfLines={1}
                  >
                    {secondary}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    );
  }

  return (
    <>
    <SolidSheet topPadding={spacing.lg}>
      {/* Başlık + kapat */}
      <View style={styles.headerRow}>
        <Text
          style={[typography.titleM, { color: theme.text, fontSize: 22, lineHeight: 28 }]}
          maxFontSizeMultiplier={1.2}
        >
          {t('search.title')}
        </Text>
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={styles.closeButton}
        >
          <X size={22} color={theme.text} weight="regular" />
        </Pressable>
      </View>

      {/* Ülke süzgeci: varsayılan Türkiye, dokununca ülke listesi açılır */}
      <Pressable
        onPress={() => setCountrySheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('search.country')}: ${locale().startsWith('tr') ? selectedCountry.tr : selectedCountry.en}`}
        style={({ pressed }) => [styles.countryRow, pressed && styles.rowPressed]}
      >
        <Globe size={16} color={theme.textSecondary} weight="regular" />
        <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('search.country')}</Text>
        <Text style={[typography.caption, { color: theme.text, flex: 1 }]} numberOfLines={1}>
          {locale().startsWith('tr') ? selectedCountry.tr : selectedCountry.en}
        </Text>
        <CaretDown size={14} color={theme.textSecondary} weight="regular" />
      </Pressable>

      {/* Arama alanı — her zaman görünür */}
      <GlassInput
        inputRef={inputRef}
        value={query}
        onChangeText={handleChangeText}
        placeholder={t('search.placeholder')}
        icon={MagnifyingGlass}
        onClear={() => handleChangeText('')}
        clearLabel={t('search.clear')}
        onSubmitEditing={handleSubmit}
      />

      {body}
    </SolidSheet>

    <SheetModal
      visible={countrySheetOpen}
      onClose={() => setCountrySheetOpen(false)}
      title={t('search.countryTitle')}
    >
      <FlatList
        data={countries}
        style={styles.countryList}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.code ?? 'all'}
        renderItem={({ item }) => {
          const label = locale().startsWith('tr') ? item.tr : item.en;
          const active = item.code === countryCode;
          return (
            <Pressable
              onPress={() => {
                setCountryCode(item.code);
                setCountrySheetOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.countryItem, pressed && styles.rowPressed]}
            >
              <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{label}</Text>
              {active ? <Check size={18} color={theme.primary} weight="bold" /> : null}
            </Pressable>
          );
        }}
      />
    </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl - 4,
    marginBottom: spacing.md,
  },
  closeButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  countryList: {
    maxHeight: 380,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    paddingVertical: spacing.xs,
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  center: {
    textAlign: 'center',
  },
  list: {
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flexShrink: 1,
  },
  separator: {
    height: 1,
    marginLeft: 52,
  },
});
