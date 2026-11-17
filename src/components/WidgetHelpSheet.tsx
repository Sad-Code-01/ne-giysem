import { CloudSun, DeviceMobile } from 'phosphor-react-native';
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

type WidgetKind = 'mini' | 'small' | 'medium';

const WIDGETS: { kind: WidgetKind; name: string; hint: string }[] = [
  { kind: 'mini', name: 'Mini', hint: 'settings.widgetMiniHint' },
  { kind: 'small', name: 'Küçük', hint: 'settings.widgetSmallHint' },
  { kind: 'medium', name: 'Orta', hint: 'settings.widgetMediumHint' },
];

const BG_OPTIONS: { value: WidgetBgMode; labelKey: string }[] = [
  { value: 'solid', labelKey: 'settings.widgetBgSolid' },
  { value: 'translucent', labelKey: 'settings.widgetBgTranslucent' },
  { value: 'clear', labelKey: 'settings.widgetBgClear' },
];

/** Uygulama içi widget önizlemesi (RemoteViews değil, sade RN görünümü). */
function WidgetPreview({ kind, selected }: { kind: WidgetKind; selected: boolean }) {
  const theme = useAppTheme();
  const bg = theme.isDark ? '#1B2733' : '#DCE8F3';
  const fg = theme.isDark ? '#EAF1F8' : '#1B2733';
  const sub = theme.isDark ? '#9FB0C0' : '#51616F';
  const accent = theme.isDark ? '#8FB8FF' : '#2F6FED';

  const box = {
    backgroundColor: bg,
    borderRadius: radius.card,
    borderWidth: selected ? 2 : 1,
    borderColor: selected ? accent : 'transparent',
    padding: spacing.sm,
    overflow: 'hidden' as const,
  };

  if (kind === 'mini') {
    return (
      <View style={[box, styles.miniRow]}>
        <CloudSun size={20} color={accent} weight="regular" />
        <Text style={[styles.previewTemp, { color: fg }]}>13°</Text>
        <Text style={[styles.previewSub, { color: sub }]}>Parçalı Bulutlu · Üsküdar</Text>
      </View>
    );
  }

  if (kind === 'small') {
    return (
      <View style={box}>
        <View style={styles.previewTopRow}>
          <Text style={[styles.previewSub, { color: sub }]}>Üsküdar</Text>
          <Text style={[styles.previewSub, { color: sub }]}>↑13 ↓9</Text>
        </View>
        <View style={styles.previewMidRow}>
          <Text style={[styles.previewTemp, { color: fg, fontSize: 30 }]}>13°</Text>
          <CloudSun size={34} color={accent} weight="regular" />
        </View>
        <Text style={[styles.previewBody, { color: fg }]}>Kazak + mont</Text>
      </View>
    );
  }

  return (
    <View style={box}>
      <View style={styles.previewTopRow}>
        <View style={{ flex: 1 }}>
          <CloudSun size={22} color={accent} weight="regular" />
          <Text style={[styles.previewTemp, { color: fg, fontSize: 26, marginTop: 2 }]}>13°</Text>
          <Text style={[styles.previewSub, { color: sub }]}>Parçalı Bulutlu · Üsküdar</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: spacing.sm }}>
          <Text style={[styles.previewBody, { color: fg, fontWeight: '700' }]}>Bugün serin!</Text>
          <Text style={[styles.previewSub, { color: sub }]}>Üst: Kazak</Text>
          <Text style={[styles.previewSub, { color: sub }]}>Dış: Mont</Text>
          <Text style={[styles.previewSub, { color: sub }]}>Aksesuar: Bere</Text>
        </View>
      </View>
      <View style={[styles.previewHourly, { borderTopColor: sub }]}>
        {['14:00', '15:00', '16:00', '17:00'].map((h) => (
          <Text key={h} style={[styles.previewSub, { color: sub, flex: 1, textAlign: 'center' }]}>
            {h} · 12°
          </Text>
        ))}
      </View>
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
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.widgetIntro')}
        </Text>

        {WIDGETS.map((widget) => (
          <Pressable
            key={widget.kind}
            onPress={() => setSelected(widget.kind)}
            accessibilityRole="button"
            accessibilityLabel={t(widget.hint)}
            style={styles.previewCard}
          >
            <WidgetPreview kind={widget.kind} selected={selected === widget.kind} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 6 }]}>
              {t(widget.hint)}
            </Text>
          </Pressable>
        ))}

        <Text style={[typography.caption, { color: theme.textSecondary, marginTop: spacing.sm }]}>
          {t('settings.widgetBgLabel')}
        </Text>
        <GlassSegmented
          options={BG_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
          value={profile.widgetBg}
          onChange={(value) => void setWidgetBg(value)}
        />
        <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('settings.widgetBgNote')}
        </Text>

        <View style={styles.steps}>
          {[1, 2, 3].map((step) => (
            <Text key={step} style={[typography.body, { color: theme.text }]} maxFontSizeMultiplier={1.3}>
              {`${step}. ${t(`settings.widgetStep${step}`, { widget: `Ne Giysem? (${selectedMeta.name})` })}`}
            </Text>
          ))}
          <View style={styles.hintRow}>
            <DeviceMobile size={16} color={theme.textSecondary} weight="regular" />
            <Text style={[typography.micro, { color: theme.textSecondary, flex: 1 }]} maxFontSizeMultiplier={1.3}>
              {t('settings.widgetAutoNote')}
            </Text>
          </View>
        </View>

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
    gap: spacing.md,
  },
  previewCard: {
    marginTop: spacing.xs,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  previewTemp: {
    fontSize: 22,
    fontWeight: '800',
  },
  previewBody: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewSub: {
    fontSize: 10,
  },
  previewHourly: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  steps: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
