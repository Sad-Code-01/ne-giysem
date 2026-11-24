import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, ScreenBackground } from '@/components/glass';
import { GarmentIcon } from '@/components/GarmentIcon';
import { SettingsHeader } from '@/components/SettingsHeader';
import { useProfile } from '@/hooks/useProfile';
import { GARMENTS, garmentLabel } from '@/logic/garmentCatalog';
import { GROUP_LABEL, groupGarments } from '@/logic/wardrobeGroups';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { MIN_TOUCH_SIZE, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Mini gardırop: katalog parçalarını işaretle, önerilerde "dolabında" vurgusu. */
export default function WardrobeScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile, toggleWardrobeItem } = useProfile();
  const owned = useMemo(() => new Set(profile.wardrobe), [profile.wardrobe]);

  const groups = useMemo(() => groupGarments(GARMENTS), []);

  const ownedCount = owned.size;

  return (
    <ScreenBackground kind="partly">
      <SettingsHeader title={t('wardrobe.title')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.body, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {t('wardrobe.subtitle')}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>
          {`${ownedCount} ${t('wardrobe.owned').toLocaleLowerCase('tr')}`}
        </Text>

        {groups.map((group) => (
          <View key={group.key} style={styles.groupWrap}>
            <Text style={[typography.micro, { color: theme.textSecondary }]}>{t(GROUP_LABEL[group.key])}</Text>
            <Glass padded={false} contentStyle={styles.groupCard}>
              {group.items.map((garment, index) => {
                const isOwned = owned.has(garment.id);
                return (
                  <View key={garment.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <Pressable
                      onPress={() => void toggleWardrobeItem(garment.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isOwned }}
                      accessibilityLabel={garmentLabel(garment)}
                      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                    >
                      <GarmentIcon garment={garment} size={22} color={theme.text} weight="duotone" />
                      <Text style={[typography.body, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                        {garmentLabel(garment)}
                      </Text>
                      {isOwned ? (
                        <Check size={18} color={theme.tabActive} weight="bold" />
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </Glass>
          </View>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  groupWrap: {
    gap: spacing.xs,
  },
  groupCard: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE + 8,
    paddingHorizontal: spacing.md,
  },
  hairline: {
    height: 1,
    backgroundColor: 'rgba(120,140,165,0.25)',
    marginLeft: 44,
  },
});
