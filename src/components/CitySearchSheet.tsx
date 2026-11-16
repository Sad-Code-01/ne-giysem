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
 * Cam SolidSheet, klavye duyarlı, autoFocus, 300ms debounce.
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

  // Geciktirilmiş arama (debounce).
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
        <ActivityIndicator color={theme.primary} />
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
          <View style={[styles.separator, { backgroundColor: theme.line, opacity: 0.25 }]} />
        )}
        renderItem={({ item }) => {
          const secondary = item.region || item.country;
          return (
            <Pressable
              onPress={() => handleSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={secondary ? `${item.name}, ${secondary}` : item.name}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            >
              <MapPin size={18} color={theme.textSecondary} weight="regular" />
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
    <SolidSheet>
      {/* Tutamaç */}
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: 'rgba(255,255,255,0.28)' }]} />
      </View>

      {/* Başlık + kapat */}
      <View style={styles.headerRow}>
        <Text
          style={[typography.titleM, { color: theme.text }]}
          maxFontSizeMultiplier={1.2}
        >
          {t('search.title')}
        </Text>
        <Pressable
          onPress={handleClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={styles.closeButton}
        >
          <X size={22} color={theme.text} weight="regular" />
        </Pressable>
      </View>

      {/* Arama alanı — her zaman görünür */}
      <View
        style={[
          styles.inputBox,
          { backgroundColor: theme.bg, borderColor: theme.line },
        ]}
      >
        <MagnifyingGlass size={18} color={theme.textSecondary} weight="regular" />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChangeText}
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          maxFontSizeMultiplier={1.3}
          style={[typography.body, styles.input, { color: theme.text }]}
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => handleChangeText('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('search.clear')}
          >
            <X size={18} color={theme.textSecondary} weight="regular" />
          </Pressable>
        ) : null}
      </View>

      {body}
    </SolidSheet>
  );
}

const styles = StyleSheet.create({
  handleRow: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
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
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  rowText: {
    flexShrink: 1,
  },
  separator: {
    height: 1,
  },
});
