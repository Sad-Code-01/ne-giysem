import * as Haptics from 'expo-haptics';
import { Bell, CalendarDots, GearSix, Sun, type Icon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, MIN_TOUCH_SIZE, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface PillTabBarProps {
  state: {
    index: number;
    routes: readonly { key: string; name: string }[];
  };
  emitter: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented?: boolean };
  };
  navigateToTab: (routeKey: string) => void;
}

const TAB_SPECS: Record<string, { icon: Icon; labelKey: string }> = {
  index: { icon: Sun, labelKey: 'tab.today' },
  hafta: { icon: CalendarDots, labelKey: 'tab.week' },
  uyarilar: { icon: Bell, labelKey: 'tab.alerts' },
  ayarlar: { icon: GearSix, labelKey: 'tab.settings' },
};

/** Opak kapsül sekme çubuğu. Aktif sekme ana dolgu. */
export function PillTabBar({ state, emitter, navigateToTab }: PillTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {state.routes.map((route, index) => {
          const spec = TAB_SPECS[route.name];
          const active = state.index === index;
          const IconComponent = spec?.icon ?? Sun;
          const label = spec ? t(spec.labelKey) : route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (event.defaultPrevented) return;
                void Haptics.selectionAsync().catch(() => undefined);
                navigateToTab(route.key);
              }}
              style={[styles.tab, active && { backgroundColor: theme.primary }]}
            >
              <IconComponent
                size={20}
                color={active ? theme.onPrimary : theme.primary}
                weight="regular"
              />
              <Text
                style={[typography.tab, { color: active ? theme.onPrimary : theme.text }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: BORDER_WIDTH,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
