'use no memo';

import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetContent } from '@/logic/widgetContent';
import { t } from '@/i18n';
import { widgetIconSvg } from '@/widgets/icons';
import { paletteFor } from '@/widgets/theme';

interface SmallWidgetProps {
  content: WidgetContent;
}

/** 2×2 widget: konum, büyük sıcaklık, hava ikonu, kısa öneri, min/max. */
export function SmallWidget({ content }: SmallWidgetProps) {
  const palette = paletteFor(content.isDay, content.bgMode);

  if (content.state === 'empty') {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        accessibilityLabel="Ne Giysem widget"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundGradient: { from: palette.bgFrom, to: palette.bgTo, orientation: 'TOP_BOTTOM' },
          borderRadius: 24,
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text={t('widget.emptyTitle')} style={{ fontSize: 18, fontWeight: '700', color: palette.text }} />
        <TextWidget
          text={t('widget.emptyHint')}
          style={{ fontSize: 12, color: palette.textSecondary, marginTop: 4 }}
        />
      </FlexWidget>
    );
  }

  const minMax =
    content.minTempC !== null && content.maxTempC !== null
      ? `↑${content.maxTempC} ↓${content.minTempC}`
      : '';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Ne Giysem küçük widget"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: { from: palette.bgFrom, to: palette.bgTo, orientation: 'TOP_BOTTOM' },
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      {/* Üst satır: konum + min/max */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
          <TextWidget
            text={content.placeName}
            maxLines={1}
            style={{ fontSize: 11, color: palette.textSecondary }}
          />
        </FlexWidget>
        {minMax ? (
          <TextWidget text={minMax} style={{ fontSize: 11, fontWeight: '600', color: palette.textSecondary }} />
        ) : null}
      </FlexWidget>

      {/* Orta: büyük sıcaklık + hava ikonu */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginTop: 6,
          marginBottom: 6,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={content.temperatureC !== null ? `${content.temperatureC}°` : '—'}
            style={{ fontSize: 38, fontWeight: '800', color: palette.text }}
          />
          {content.conditionLabel ? (
            <TextWidget
              text={content.conditionLabel}
              maxLines={1}
              style={{ fontSize: 12, color: palette.textSecondary, marginTop: -2 }}
            />
          ) : null}
        </FlexWidget>
        {content.weatherIconKey ? (
          <SvgWidget svg={widgetIconSvg(content.weatherIconKey, palette.iconColor)} style={{ height: 40, width: 40 }} />
        ) : null}
      </FlexWidget>

      {/* Alt: öneri + bayatlık etiketi */}
      {content.suggestionShort ? (
        <TextWidget
          text={content.suggestionShort}
          maxLines={1}
          style={{ fontSize: 12, fontWeight: '600', color: palette.text }}
        />
      ) : content.suggestionTitle ? (
        <TextWidget
          text={content.suggestionTitle}
          maxLines={1}
          style={{ fontSize: 12, fontWeight: '600', color: palette.text }}
        />
      ) : null}
      {content.staleLabel ? (
        <TextWidget text={content.staleLabel} style={{ fontSize: 10, color: palette.staleColor, marginTop: 4 }} />
      ) : null}
    </FlexWidget>
  );
}
