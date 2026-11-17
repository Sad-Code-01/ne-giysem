import { Bell, CaretRight } from 'phosphor-react-native';
import { useEffect, useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { OFFICIAL_SOURCES } from '@/constants/officialSources';
import { Glass, IconBadge, ScreenBackground } from '@/components/glass';
import { useTabFade } from '@/hooks/useTabFade';
import { t } from '@/i18n';
import { onScrollToTopRequest } from '@/lib/scrollToTop';
import { useAppTheme } from '@/theme/useAppTheme';
import { SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Uyarılar: resmî kurumların uyarı sayfalarına cam bağlantı kartları. */
export default function AlertsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const fadeStyle = useTabFade();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(
    () =>
      onScrollToTopRequest('uyarilar', () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }),
    []
  );

  return (
    <ScreenBackground kind="partly" isDay={!theme.isDark}>
      <Animated.View style={[styles.flex, fadeStyle]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={[typography.titleL, { color: theme.text }]}>{t('alerts.title')}</Text>
          </Animated.View>
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('alerts.subtitle')}
          </Text>

          <View style={styles.list}>
            {OFFICIAL_SOURCES.map((source, index) => (
              <Animated.View key={source.id} entering={FadeInDown.delay(80 + index * 50).duration(280)}>
                <Pressable
                  onPress={() => void WebBrowser.openBrowserAsync(source.url)}
                  accessibilityRole="link"
                  accessibilityLabel={`${source.name} — ${source.description}`}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Glass padded={false} contentStyle={styles.card}>
                    <IconBadge icon={Bell} size={20} boxSize={40} />
                    <View style={styles.cardText}>
                      <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
                        {source.name}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                        {source.description}
                      </Text>
                    </View>
                    <CaretRight size={18} color={theme.textSecondary} weight="regular" />
                  </Glass>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Text style={[typography.micro, styles.footer, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('alerts.footer')}
          </Text>
        </ScrollView>
      </Animated.View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    minHeight: 64,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
