import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';

/** Alt sekme çubuğu — yüzen opak kapsül, 4 sekme. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="hafta" />
      <Tabs.Screen name="uyarilar" />
      <Tabs.Screen name="ayarlar" />
    </Tabs>
  );
}
