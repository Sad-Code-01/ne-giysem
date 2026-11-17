import React from 'react';
import type { WidgetRepresentation } from 'react-native-android-widget';

import type { WidgetContent } from '@/logic/widgetContent';
import { MediumWidget } from '@/widgets/MediumWidget';
import { MiniWidget } from '@/widgets/MiniWidget';
import { SmallWidget } from '@/widgets/SmallWidget';

export const WIDGET_NAMES = {
  mini: 'Mini',
  small: 'Kucuk',
  medium: 'Orta',
} as const;

/** Widget adı + içerik → render edilecek ağaç (palet `is_day`'e göre içeride seçilir). */
export function renderWidgetTrees(
  widgetName: string,
  content: WidgetContent
): WidgetRepresentation {
  if (widgetName === WIDGET_NAMES.medium) {
    return <MediumWidget content={content} />;
  }
  if (widgetName === WIDGET_NAMES.mini) {
    return <MiniWidget content={content} />;
  }
  return <SmallWidget content={content} />;
}
