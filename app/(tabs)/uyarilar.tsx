import { Bell } from 'phosphor-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OFFICIAL_SOURCES } from '@/constants/officialSources';
import { Screen } from '@/components/Screen';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, radius, SCREEN_PADDING, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import * as WebBrowser from 'expo-web-browser';

/** Uyarılar: resmî kurumların uyarı sayfalarına bağlantılar. */
export default function AlertsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.titleL, { color: theme.text }]}>{t('alerts.title')}</Text>
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('alerts.subtitle')}
        </Text>

        <View style={styles.list}>
          {OFFICIAL_SOURCES.map((source) => (
            <Pressable
              key={source.id}
              onPress={() => void WebBrowser.openBrowserAsync(source.url)}
              accessibilityRole="link"
              accessibilityLabel={`${source.name} — ${source.description}`}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.primary }]}>
                <Bell size={20} color={theme.onPrimary} weight="regular" />
              </View>
              <View style={styles.cardText}>
                <Text style={[typography.titleS, { color: theme.text }]} numberOfLines={1}>
                  {source.name}
                </Text>
                <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                  {source.description}
                </Text>
              </View>
              <Text style={[typography.titleS, { color: theme.textSecondary }]}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[typography.micro, styles.footer, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('alerts.footer')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    padding: spacing.lg,
    minHeight: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
