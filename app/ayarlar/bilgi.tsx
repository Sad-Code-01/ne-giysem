import { CloudSun, GraduationCap, MapPin, Thermometer } from 'phosphor-react-native';
import { useEffect, useRef, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, IconBadge, ScreenBackground } from '@/components/glass';
import { SettingsHeader } from '@/components/SettingsHeader';
import { useTabFade } from '@/hooks/useTabFade';
import { onScrollToTopRequest } from '@/lib/scrollToTop';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Icon } from 'phosphor-react-native';

const INFO_ITEMS: { icon: Icon; titleKey: string; bodyKey: string }[] = [
  { icon: CloudSun, titleKey: 'info.weatherTitle', bodyKey: 'info.weatherBody' },
  { icon: MapPin, titleKey: 'info.placeTitle', bodyKey: 'info.placeBody' },
  { icon: Thermometer, titleKey: 'info.coldTitle', bodyKey: 'info.coldBody' },
  { icon: GraduationCap, titleKey: 'info.learnTitle', bodyKey: 'info.learnBody' },
];

/** Ayarlar alt sayfası: "Ne Giysem?" önerilerinin nasıl üretildiği. */
export default function InfoScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const fadeStyle = useTabFade();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(
    () =>
      onScrollToTopRequest('bilgi', () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }),
    []
  );

  return (
    <ScreenBackground kind="partly">
      <SettingsHeader title={t('info.title')} />
      <Animated.View style={[styles.flex, fadeStyle]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('info.subtitle')}
          </Text>

          <View style={styles.list}>
            {INFO_ITEMS.map((item, index) => (
              <Animated.View key={item.titleKey} entering={FadeInDown.delay(index * 50).duration(280)}>
                <Glass contentStyle={styles.card}>
                  <IconBadge icon={item.icon} size={20} boxSize={40} />
                  <View style={styles.cardText}>
                    <Text style={[typography.titleS, { color: theme.text }]}>{t(item.titleKey)}</Text>
                    <Text style={[typography.caption, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                      {t(item.bodyKey)}
                    </Text>
                  </View>
                </Glass>
              </Animated.View>
            ))}
          </View>

          <Text style={[typography.micro, styles.footer, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
            {t('info.footer')}
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
    paddingTop: spacing.md,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
