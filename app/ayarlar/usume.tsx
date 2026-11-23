import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, GlassButton, ScreenBackground } from '@/components/glass';
import { SettingsHeader } from '@/components/SettingsHeader';
import { useProfile } from '@/hooks/useProfile';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { t } from '@/i18n';
import { computeWeatherScale } from '@/logic/weatherScale';
import { getWeatherVisual } from '@/logic/weatherCodes';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ColdSensitivity } from '@/types';

const COLD_OPTIONS: readonly { value: ColdSensitivity; key: string }[] = [
  { value: 'none', key: 'cold.none' },
  { value: 'little', key: 'cold.little' },
  { value: 'normal', key: 'cold.normal' },
  { value: 'quick', key: 'cold.quick' },
  { value: 'very', key: 'cold.very' },
];

const SCALE_CARDS = [
  { key: 'settings.coldScaleTshirt', dot: 'amber' },
  { key: 'settings.coldScaleJacket', dot: 'ice' },
  { key: 'settings.coldScaleCoat', dot: 'text' },
  { key: 'settings.coldScaleAvoid', dot: 'tertiary' },
] as const;

/** Üşüme ayarı + canlı Hava ölçeği. */
export default function ColdSettingsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile, outfitProfile, setColdSensitivity, setLearnedOffset } = useProfile();
  const { snapshot } = useWeatherContext();
  const [saving, setSaving] = useState(false);

  const scale = useMemo(
    () => computeWeatherScale(outfitProfile, snapshot),
    [outfitProfile, snapshot]
  );

  // Mevcut sınıf: bugünün en ılıman dilim bandına göre.
  const currentClass = useMemo(() => {
    if (!snapshot) return null;
    const today = snapshot.daily.find((d) => !d.isPast && d.date === snapshot.current.time.slice(0, 10));
    if (!today) return null;
    const mean = (today.temperatureMax + today.temperatureMin) / 2;
    const effective = mean + (outfitProfile.coldSensitivity === 'very' ? -3 : outfitProfile.coldSensitivity === 'quick' ? -1.5 : outfitProfile.coldSensitivity === 'little' ? 1.5 : outfitProfile.coldSensitivity === 'none' ? 3 : 0) + outfitProfile.learnedOffset;
    if (effective >= 18) return 'settings.coldScaleTshirt';
    if (effective >= 12) return 'settings.coldScaleJacket';
    return 'settings.coldScaleCoat';
  }, [snapshot, outfitProfile]);

  const dotColor = (name: string): string => {
    switch (name) {
      case 'amber':
        return theme.accent;
      case 'ice':
        return theme.primary;
      case 'text':
        return theme.text;
      default:
        return theme.textSecondary;
    }
  };

  const rangeFor = (index: number): string => {
    if (index === 0) return scale.tshirt.label;
    if (index === 1) return scale.jacket.label;
    if (index === 2) return scale.coat.label;
    return scale.avoid;
  };

  const select = async (value: ColdSensitivity): Promise<void> => {
    if (saving || value === profile.coldSensitivity) return;
    setSaving(true);
    void Haptics.selectionAsync().catch(() => undefined);
    try {
      await setColdSensitivity(value);
    } finally {
      setSaving(false);
    }
  };

  const cityName = snapshot?.place.name ?? '';
  const backdrop = snapshot
    ? (() => {
        const visual = getWeatherVisual(snapshot.current.weatherCode, snapshot.current.isDay);
        return { kind: visual.kind, isDay: snapshot.current.isDay };
      })()
    : { kind: 'partly' as const, isDay: true };

  return (
    <ScreenBackground kind={backdrop.kind}>
      <SettingsHeader title={t('settings.coldTitle')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body, { color: theme.textSecondary }]}>
          {t('settings.coldSubtitle', { city: cityName })}
        </Text>

        {/* Hava ölçeği kartları */}
        <View style={styles.scaleGrid}>
          {SCALE_CARDS.map((card, index) => {
            const isCurrent = currentClass === card.key;
            return (
              <Glass
                key={card.key}
                cornerRadius={radius.sm}
                padding={spacing.md}
                style={[styles.scaleCard, isCurrent && { borderColor: theme.primary }]}
              >
                <View style={[styles.dot, { backgroundColor: dotColor(card.dot) }]} />
                <Text style={[typography.caption, { color: theme.text }]} numberOfLines={1}>
                  {t(card.key)}
                </Text>
                <Text style={[typography.tab, { color: theme.textSecondary }]} numberOfLines={2}>
                  {rangeFor(index)}
                </Text>
                {isCurrent ? (
                  <Text style={[typography.tab, { color: theme.primary }]}>●</Text>
                ) : null}
              </Glass>
            );
          })}
        </View>

        {/* 5 kademeli kaydırıcı */}
        <Text style={[typography.titleS, { color: theme.text, marginTop: spacing.lg }]}>
          {t('settings.coldSliderLabel')}
        </Text>
        <View style={styles.sliderRow}>
          {COLD_OPTIONS.map((option, index) => {
            const active = profile.coldSensitivity === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => void select(option.value)}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(option.key)}
                style={styles.sliderStop}
              >
                <View
                  style={[
                    styles.sliderDot,
                    {
                      backgroundColor: active ? theme.primary : 'transparent',
                      borderColor: active ? theme.primary : theme.textSecondary,
                    },
                  ]}
                />
                {index < COLD_OPTIONS.length - 1 ? (
                  <View style={[styles.sliderLine, { backgroundColor: 'rgba(120,140,165,0.35)' }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('settings.coldLess')}</Text>
          <Text style={[typography.caption, { color: theme.text }]}>
            {t(COLD_OPTIONS.find((o) => o.value === profile.coldSensitivity)?.key ?? 'cold.normal')}
          </Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('settings.coldMore')}</Text>
        </View>

        {profile.learnedOffset !== 0 ? (
          <Glass contentStyle={styles.learnedCard}>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {t('settings.learnedNote')}
            </Text>
            <GlassButton
              label={t('settings.learnedReset')}
              variant="secondary"
              onPress={() => void setLearnedOffset(0)}
            />
          </Glass>
        ) : null}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  scaleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  scaleCard: {
    width: '48%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  learnedCard: {
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.xs,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sliderStop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sliderDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  sliderLine: {
    flex: 1,
    height: 1,
    marginHorizontal: spacing.xs,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
