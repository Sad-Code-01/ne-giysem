import { Check, CloudSun } from 'phosphor-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassButton, GlassSegmented } from '@/components/glass';
import { SheetModal } from '@/components/SheetModal';
import { useProfile } from '@/hooks/useProfile';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { WidgetBgMode } from '@/storage/profileStore';

interface WidgetHelpSheetProps {
  visible: boolean;
  onClose: () => void;
}

export type WidgetKind = 'mini' | 'small' | 'medium';

export const WIDGETS: { kind: WidgetKind; name: string; cells: string; hint: string; height: number; provider: string }[] = [
  { kind: 'mini', name: 'Mini', cells: '2×1', hint: 'settings.widgetMiniHint', height: 44, provider: 'Mini' },
  { kind: 'small', name: 'Küçük', cells: '3×2', hint: 'settings.widgetSmallHint', height: 92, provider: 'Kucuk' },
  { kind: 'medium', name: 'Orta', cells: '4×2', hint: 'settings.widgetMediumHint', height: 104, provider: 'Orta' },
];

const BG_OPTIONS: { value: WidgetBgMode; labelKey: string }[] = [
  { value: 'solid', labelKey: 'settings.widgetBgSolid' },
  { value: 'translucent', labelKey: 'settings.widgetBgTranslucent' },
  { value: 'clear', labelKey: 'settings.widgetBgClear' },
];

/** Uygulama içi widget önizlemesi — gerçek boyut oranlarına yakın (RemoteViews değil). */
export function WidgetPreview({ kind, height, selected }: { kind: WidgetKind; height: number; selected: boolean }) {
  const theme = useAppTheme();
  const bg = theme.isDark ? '#1B2733' : '#E4EDF7';
  const fg = theme.isDark ? '#EAF1F8' : '#1B2733';
  const sub = theme.isDark ? '#9FB0C0' : '#51616F';
  const accent = theme.isDark ? '#8FB8FF' : '#2F6FED';

  const box = {
    backgroundColor: bg,
    borderRadius: 16,
    borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
    borderColor: selected ? accent : theme.line,
    padding: spacing.sm,
    overflow: 'hidden' as const,
    height,
    width: '100%',
    justifyContent: 'center' as const,
  };

  if (kind === 'mini') {
    return (
      <View style={[box, styles.miniRow]}>
        <CloudSun size={16} color={accent} weight="regular" />
        <Text style={[styles.previewTemp, { color: fg }]}>13°</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.previewSub, { color: sub }]} numberOfLines={1}>Parçalı · Üsküdar</Text>
        </View>
      </View>
    );
  }

  if (kind === 'small') {
    return (
      <View style={box}>
        <View style={styles.previewMidRow}>
          <Text style={[styles.previewTemp, { color: fg }]}>13°</Text>
          <CloudSun size={20} color={accent} weight="regular" />
        </View>
        <Text style={[styles.previewSub, { color: sub }]} numberOfLines={1}>Kazak + mont</Text>
      </View>
    );
  }

  return (
    <View style={box}>
      <View style={styles.previewMidRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.previewTemp, { color: fg }]}>13°</Text>
          <Text style={[styles.previewSub, { color: sub }]} numberOfLines={1}>Parçalı · Üsküdar</Text>
        </View>
        <CloudSun size={20} color={accent} weight="regular" />
      </View>
      <Text style={[styles.previewSub, { color: fg }]} numberOfLines={1}>Üst: Kazak · Mont</Text>
    </View>
  );
}

/**
 * Widget tanıtım + ekleme yönergesi sheet'i.
 * Android'de programatik pinleme API'si yok; örnek seçilince adımı adım
 * ana ekrana ekleme talimatı gösterilir. Şeffaflık tüm widget'lara uygulanır.
 */
export function WidgetHelpSheet({ visible, onClose }: WidgetHelpSheetProps) {
  const theme = useAppTheme();
  const { profile, setWidgetBg } = useProfile();
  const [selected, setSelected] = useState<WidgetKind>('medium');

  const selectedMeta = WIDGETS.find((w) => w.kind === selected) ?? WIDGETS[2];

  return (
    <SheetModal visible={visible} onClose={onClose} title={t('settings.widgetSheetTitle')}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Örnekler: gerçek oranlarda, yanaşık; dokun-seç */}
        <View style={styles.previewRow}>
          {WIDGETS.map((widget) => {
            const active = selected === widget.kind;
            return (
              <Pressable
                key={widget.kind}
                onPress={() => setSelected(widget.kind)}
                accessibilityRole="button"
                accessibilityLabel={`${widget.name} ${widget.cells}`}
                accessibilityState={{ selected: active }}
                style={styles.previewItem}
              >
                <WidgetPreview kind={widget.kind} height={widget.height} selected={active} />
                <View style={styles.previewLabelRow}>
                  {active ? (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Check size={10} color="#FFFFFF" weight="bold" />
                    </View>
                  ) : null}
                  <Text
                    style={[
                      typography.micro,
                      { color: active ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {widget.name} · {widget.cells}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t(selectedMeta.hint)}
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

        <View style={styles.sectionLabel}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('settings.widgetStepsTitle')}</Text>
        </View>
        <View style={styles.steps}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={[styles.stepRow, { borderColor: 'rgba(120,140,165,0.25)' }]}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Text style={[typography.micro, { color: '#FFFFFF', fontWeight: '700' }]}>{step}</Text>
              </View>
              <Text style={[typography.caption, { color: theme.text, flex: 1 }]} maxFontSizeMultiplier={1.3}>
                {t(`settings.widgetStep${step}`, { widget: `Ne Giysem? (${selectedMeta.name})` })}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.widgetAutoNote')}
        </Text>

        <GlassButton label={t('common.close')} variant="secondary" onPress={onClose} />
      </ScrollView>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
  body: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTemp: {
    fontSize: 17,
    fontWeight: '800',
  },
  previewSub: {
    fontSize: 9,
    marginTop: 1,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    minHeight: 16,
  },
  checkBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: spacing.xs,
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
