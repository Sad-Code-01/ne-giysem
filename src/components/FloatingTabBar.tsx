import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  CalendarBlank,
  CloudSun,
  GearSix,
  type Icon,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { t } from '@/i18n';
import { requestScrollToTop } from '@/lib/scrollToTop';
import {
  glassIndicatorBorder,
  glassIndicatorFill,
  glassMaterial,
} from '@/theme/glass';
import { useAppTheme } from '@/theme/useAppTheme';
import { BORDER_WIDTH, MIN_TOUCH_SIZE, radius, spacing } from '@/theme/spacing';

interface FloatingTabBarProps {
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
  insets: { top: number; right: number; bottom: number; left: number };
}

const TAB_SPECS: Record<string, { icon: Icon; labelKey: string }> = {
  index: { icon: CloudSun, labelKey: 'tab.today' },
  hafta: { icon: CalendarBlank, labelKey: 'tab.week' },
  uyarilar: { icon: Bell, labelKey: 'tab.alerts' },
  ayarlar: { icon: GearSix, labelKey: 'tab.settings' },
};

const PILL_HEIGHT = 64;
const SCREEN_PADDING_EDGE = spacing.lg;
const INDICATOR_HEIGHT = 48;
const PILL_PADDING = 8;

const ANDROID_BLUR_METHOD =
  Platform.OS === 'android'
    ? Platform.Version >= 31
      ? 'dimezisBlurViewSdk31Plus'
      : 'dimezisBlurView'
    : undefined;

/**
 * Yüzen cam sekme çubuğu: ikon-only hap, içeriğin arkasından bulanık akar;
 * klavye açılınca gizlenir.
 */
export function FloatingTabBar({ state, emitter, navigateToTab, insets }: FloatingTabBarProps) {
  const theme = useAppTheme();
  const [pillWidth, setPillWidth] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const translateX = useSharedValue(0);
  const indicatorScaleX = useSharedValue(1);
  const hiddenOffset = useSharedValue(0);
  const hiddenOpacity = useSharedValue(1);

  const cellCount = Math.max(state.routes.length, 1);
  const cellWidth = pillWidth > 0 ? (pillWidth - PILL_PADDING * 2) / cellCount : 0;

  // Aktif sekme değişince kayan iç hap kayar + hafif esner.
  useEffect(() => {
    if (cellWidth <= 0) return;
    translateX.value = withSpring(state.index * cellWidth, {
      damping: 18,
      stiffness: 220,
    });
    indicatorScaleX.value = withSequence(
      withTiming(1.08, { duration: 120 }),
      withSpring(1, { damping: 18, stiffness: 220 })
    );
  }, [state.index, cellWidth, translateX, indicatorScaleX]);

  // Klavye açılınca çubuk aşağı kayar ve solar.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const target = keyboardOpen ? PILL_HEIGHT + insets.bottom + spacing.xl : 0;
    hiddenOffset.value = withTiming(target, { duration: 180 });
    hiddenOpacity.value = withTiming(keyboardOpen ? 0 : 1, { duration: 180 });
  }, [keyboardOpen, insets.bottom, hiddenOffset, hiddenOpacity]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hiddenOffset.value }],
    opacity: hiddenOpacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    width: cellWidth,
    transform: [{ translateX: translateX.value }, { scaleX: indicatorScaleX.value }],
  }));

  const isDark = theme.isDark;
  const material = glassMaterial(theme, 'pill');

  const materialStyle = [
    styles.materialClip,
    { borderColor: material.border, backgroundColor: material.fill },
  ];

  return (
    <Animated.View
      style={[
        styles.positioner,
        { paddingBottom: Math.max(insets.bottom, 0) + spacing.sm },
        barStyle,
      ]}
      pointerEvents={keyboardOpen ? 'none' : 'auto'}
    >
      <View style={styles.row}>
        {/* Ana hap: 4 ikon */}
        <View
          style={[styles.pillShadow, { borderRadius: radius.pill }]}
          onLayout={(event) => setPillWidth(event.nativeEvent.layout.width)}
        >
          <View style={[materialStyle, styles.pill]}>
            <BlurView
              intensity={50}
              tint={isDark ? 'dark' : 'light'}
              blurMethod={ANDROID_BLUR_METHOD}
              style={StyleSheet.absoluteFill}
            />
            {/* Üst kenarda ince parlak iç çizgi */}
            <View
              style={[
                styles.topHighlight,
                { backgroundColor: material.highlight },
              ]}
            />
            {cellWidth > 0 ? (
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    top: PILL_PADDING,
                    left: PILL_PADDING,
                    height: INDICATOR_HEIGHT,
                    borderRadius: INDICATOR_HEIGHT / 2,
                    backgroundColor: glassIndicatorFill(theme),
                    borderColor: glassIndicatorBorder(theme),
                    borderWidth: BORDER_WIDTH,
                  },
                  indicatorStyle,
                ]}
              />
            ) : null}
            {state.routes.map((route, index) => {
              const spec = TAB_SPECS[route.name];
              const active = state.index === index;
              const IconComponent = spec?.icon ?? CloudSun;
              const label = spec ? t(spec.labelKey) : route.name;
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                  onPress={() => {
                    const event = emitter.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (event.defaultPrevented) return;
                    void Haptics.selectionAsync().catch(() => undefined);
                    if (active) {
                      requestScrollToTop(route.name);
                    }
                    navigateToTab(route.key);
                  }}
                  style={styles.cell}
                >
                  <IconComponent
                    size={26}
                    color={active ? theme.tabActive : theme.textSecondary}
                    weight={active ? 'fill' : 'regular'}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_PADDING_EDGE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillShadow: {
    flex: 1,
    // iOS gölge; Android'de elevation.
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  materialClip: {
    flex: 1,
    borderWidth: BORDER_WIDTH,
    overflow: 'hidden',
  },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 1,
    borderRadius: 1,
  },
  indicator: {
    position: 'absolute',
  },
  cell: {
    flex: 1,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: MIN_TOUCH_SIZE,
  },
});
