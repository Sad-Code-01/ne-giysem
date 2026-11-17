import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { resolveWidgetData } from '@/widgets/resolveWidgetData';
import { renderWidgetTrees } from '@/widgets/render';

/**
 * Android widget görev işleyicisi — `index.ts` girişinde kaydedilir.
 * Headless çalışır: AsyncStorage + Open-Meteo, hook yok.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await resolveWidgetData();
      props.renderWidget(renderWidgetTrees(props.widgetInfo.widgetName, data.content));
      break;
    }
    case 'WIDGET_CLICK': {
      // Tüm widget'lar OPEN_APP ile açılır; ek işlem gerekmez.
      break;
    }
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
