import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Devices, WarningCircle } from 'phosphor-react-native';
import { requestPinWidget } from 'react-native-android-widget';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, GlassButton, GlassSegmented, ScreenBackground } from '@/components/glass';
import { SettingsHeader } from '@/components/SettingsHeader';
import { WIDGETS, WidgetPreview, type WidgetKind } from '@/components/WidgetHelpSheet';
import { useProfile } from '@/hooks/useProfile';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { WidgetBgMode } from '@/storage/profileStore';

const BG_OPTIONS: { value: WidgetBgMode; labelKey: string }[] = [
  { value: 'solid', labelKey: 'settings.widgetBgSolid' },
  { value: 'translucent', labelKey: 'settings.widgetBgTranslucent' },
  { value: 'clear', labelKey: 'settings.widgetBgClear' },
];

/**
 * Widget'lar alt sayfası: her boyut için önizleme + "Ana ekrana ekle".
 * Android 8+ launcher'larda `requestPinWidget` sistem onay diyaloğu açar;
 * desteklenmeyen launcher'larda elle ekleme adımları gösterilir.
 */
export default function WidgetsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile, setWidgetBg } = useProfile();
  const [busy, setBusy] = useState<WidgetKind | null>(null);
  const [pinFailed, setPinFailed] = useState(false);

  const handleAdd = async (kind: WidgetKind): Promise<void> => {
    if (busy) return;
    const meta = WIDGETS.find((w) => w.kind === kind);
    if (!meta || Platform.OS !== 'android') {
      setPinFailed(true);
      return;
    }
    setBusy(kind);
    setPinFailed(false);
    try {
      const accepted = await requestPinWidget({ widgetName: meta.provider });
      if (!accepted) setPinFailed(true);
    } catch {
      setPinFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScreenBackground kind="partly">
      <SettingsHeader title={t('settings.widgetSheetTitle')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.widgetIntro')}
        </Text>

        <View style={styles.sectionLabel}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('settings.widgetBgLabel')}</Text>
        </View>
        <GlassSegmented
          options={BG_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
          value={profile.widgetBg}
          onChange={(value) => void setWidgetBg(value)}
        />
        <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.widgetBgNote')}
        </Text>

        {WIDGETS.map((widget) => (
          <Glass key={widget.kind} padded contentStyle={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.titleS, { color: theme.text }]}>
                  {widget.name} <Text style={[typography.caption, { color: theme.textSecondary }]}>· {widget.cells}</Text>
                </Text>
                <Text style={[typography.micro, { color: theme.textSecondary, marginTop: 4 }]} maxFontSizeMultiplier={1.3}>
                  {t(widget.hint)}
                </Text>
              </View>
              <View style={[styles.sizeBadge, { borderColor: theme.line }]}>
                <Devices size={14} color={theme.textSecondary} />
                <Text style={[typography.micro, { color: theme.textSecondary }]}>{widget.cells}</Text>
              </View>
            </View>

            <View style={styles.previewWrap}>
              <WidgetPreview kind={widget.kind} height={widget.height} selected={false} />
            </View>

            <GlassButton
              label={busy === widget.kind ? '…' : t('settings.widgetAddToHome')}
              onPress={() => void handleAdd(widget.kind)}
              disabled={busy !== null}
            />
          </Glass>
        ))}

        {pinFailed ? (
          <View style={[styles.notice, { borderColor: theme.line }]}>
            <WarningCircle size={16} color={theme.textSecondary} />
            <Text style={[typography.caption, { color: theme.textSecondary, flex: 1 }]} maxFontSizeMultiplier={1.3}>
              {t('settings.widgetPinUnsupported')}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionLabel}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('settings.widgetStepsTitle')}</Text>
        </View>
        <View style={styles.steps}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={[styles.stepRow, { borderColor: 'rgba(120,140,165,0.25)' }]}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Check size={12} color="#FFFFFF" weight="bold" />
              </View>
              <Text style={[typography.caption, { color: theme.text, flex: 1 }]} maxFontSizeMultiplier={1.3}>
                {t(`settings.widgetStep${step}`, { widget: t('settings.widgetSheetTitle') })}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  previewWrap: {
    alignItems: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  steps: {
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
