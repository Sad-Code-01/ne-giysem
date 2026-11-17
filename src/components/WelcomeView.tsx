import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassButton } from '@/components/glass/GlassButton';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface WelcomeViewProps {
  onUseLocation: () => void;
  isBusy: boolean;
}

/** Karşılama ekranı içeriği — gradyan zemin üzerinde cam hisli blok. */
export function WelcomeView({ onUseLocation, isBusy }: WelcomeViewProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={styles.content}>
      <Text
        style={[typography.titleL, styles.center, { color: theme.text }]}
        maxFontSizeMultiplier={1.2}
      >
        {t('welcome.appName')}
      </Text>
      <Text
        style={[typography.titleM, styles.center, { color: theme.text }]}
        maxFontSizeMultiplier={1.2}
      >
        {t('welcome.title')}
      </Text>
      <Text
        style={[typography.body, styles.center, { color: theme.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        {t('welcome.subtitle')}
      </Text>

      <View style={styles.actions}>
        <GlassButton label={t('welcome.useLocation')} onPress={onUseLocation} disabled={isBusy} style={styles.button} />
        <GlassButton
          label={t('welcome.searchCity')}
          variant="secondary"
          onPress={() => router.push('/sehir-ara')}
          disabled={isBusy}
          style={styles.button}
        />
      </View>

      <Text
        style={[typography.caption, styles.center, { color: theme.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        {t('welcome.privacy')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    width: '100%',
  },
});
