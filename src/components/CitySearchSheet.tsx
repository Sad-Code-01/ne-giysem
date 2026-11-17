import { MagnifyingGlass, MapPin, X } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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
import { Glass, GlassInput } from '@/components/glass';
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from '@/constants/config';
import { useProfile } from '@/hooks/useProfile';
import { t } from '@/i18n';
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
  const { selectPlace } = useWeatherContext();
  const { addCity } = useProfile();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

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

  // Geciktirilmiş arama (debounce) + eski istekleri iptal et.
  useEffect(() => {
    if (trimmed.length < MIN_SEARCH_LENGTH) return;

    const timer = setTimeout(() => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      searchCities(trimmed)
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
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

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
    router.back();
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

      {/* Arama alanı — her zaman görünür */}
      <GlassInput
        inputRef={inputRef}
        value={query}
        onChangeText={handleChangeText}
        placeholder={t('search.placeholder')}
        icon={MagnifyingGlass}
        onClear={() => handleChangeText('')}
        clearLabel={t('search.clear')}
      />

      {body}
    </SolidSheet>
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
