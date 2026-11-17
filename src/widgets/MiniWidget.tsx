'use no memo';

import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetContent } from '@/logic/widgetContent';
import { t } from '@/i18n';
import { widgetIconSvg } from '@/widgets/icons';
import { paletteFor } from '@/widgets/theme';

interface MiniWidgetProps {
  content: WidgetContent;
}

/** 2×1 mini widget: hava ikonu + büyük sıcaklık + durum/konum tek satır. */
export function MiniWidget({ content }: MiniWidgetProps) {
  const palette = paletteFor(content.isDay, content.bgMode);

  if (content.state === 'empty') {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        accessibilityLabel="Ne Giysem mini widget"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: palette.bgFrom,
          borderRadius: 24,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text={t('widget.emptyTitle')}
          maxLines={1}
          style={{ fontSize: 14, fontWeight: '700', color: palette.text }}
        />
        <TextWidget
          text={t('widget.emptyHint')}
          maxLines={1}
          style={{ fontSize: 11, color: palette.textSecondary }}
        />
      </FlexWidget>
    );
  }

  const subtitle = [content.conditionLabel, content.placeName].filter(Boolean).join(' · ');

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Ne Giysem mini widget"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bgFrom,
        borderRadius: 24,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {content.weatherIconKey ? (
        <SvgWidget
          svg={widgetIconSvg(content.weatherIconKey, palette.iconColor)}
          style={{ height: 26, width: 26, marginRight: 8 }}
        />
      ) : null}
      <TextWidget
        text={content.temperatureC !== null ? `${content.temperatureC}°` : '—'}
        style={{ fontSize: 26, fontWeight: '800', color: palette.text }}
      />
      <FlexWidget style={{ flex: 1, marginLeft: 8 }}>
        {subtitle ? (
          <TextWidget text={subtitle} maxLines={1} style={{ fontSize: 11, color: palette.textSecondary }} />
        ) : null}
        {content.suggestionShort ? (
          <TextWidget
            text={content.suggestionShort}
            maxLines={1}
            style={{ fontSize: 11, fontWeight: '600', color: palette.text, marginTop: 1 }}
          />
        ) : null}
      </FlexWidget>
      {content.staleLabel ? (
        <TextWidget text={content.staleLabel} maxLines={1} style={{ fontSize: 9, color: palette.staleColor }} />
      ) : null}
    </FlexWidget>
  );
}
