import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassButton } from '@/components/glass/GlassButton';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ServiceErrorKind } from '@/types';

const ERROR_COPY: Record<ServiceErrorKind, { titleKey: string; messageKey: string }> = {
  offline: { titleKey: 'error.offline', messageKey: 'error.offlineMsg' },
  api: { titleKey: 'error.api', messageKey: 'error.apiMsg' },
  parse: { titleKey: 'error.parse', messageKey: 'error.parseMsg' },
  permission: { titleKey: 'error.location', messageKey: 'error.permissionMsg' },
  location: { titleKey: 'error.locationNotFound', messageKey: 'error.locationMsg' },
};

interface ErrorViewProps {
  kind: ServiceErrorKind;
  onRetry: () => void;
}

/** Hata: başlık, açıklama, tekrar ve şehir arama. */
export function ErrorView({ kind, onRetry }: ErrorViewProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const copy = ERROR_COPY[kind];

  return (
    <View style={styles.content}>
      <Text style={[typography.titleL, styles.center, { color: theme.text }]} maxFontSizeMultiplier={1.2}>
        {t(copy.titleKey)}
      </Text>
      <Text style={[typography.body, styles.center, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
        {t(copy.messageKey)}
      </Text>
      <View style={styles.actions}>
        <GlassButton label={t('common.retry')} onPress={onRetry} />
        <GlassButton
          label={t('welcome.searchCity')}
          variant="secondary"
          onPress={() => router.push('/sehir-ara')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
