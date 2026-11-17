'use no memo';

import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetContent } from '@/logic/widgetContent';
import { t } from '@/i18n';
import { widgetIconSvg } from '@/widgets/icons';
import { paletteFor } from '@/widgets/theme';

interface MediumWidgetProps {
  content: WidgetContent;
}

/** 4×2 widget: solda sıcaklık/durum/konum, sağda öneri, altta 4 saatlik şerit. */
export function MediumWidget({ content }: MediumWidgetProps) {
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
        <TextWidget text={t('widget.emptyTitle')} style={{ fontSize: 20, fontWeight: '700', color: palette.text }} />
        <TextWidget
          text={t('widget.emptyHint')}
          style={{ fontSize: 13, color: palette.textSecondary, marginTop: 4 }}
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
      accessibilityLabel="Ne Giysem orta widget"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: { from: palette.bgFrom, to: palette.bgTo, orientation: 'TOP_BOTTOM' },
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      {/* Üst blok: sol hava, sağ öneri */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          flex: 1,
        }}
      >
        {/* Sol: sıcaklık + durum + konum */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {content.weatherIconKey ? (
            <SvgWidget
              svg={widgetIconSvg(content.weatherIconKey, palette.iconColor)}
              style={{ height: 24, width: 24, marginBottom: 4 }}
            />
          ) : null}
          <TextWidget
            text={content.temperatureC !== null ? `${content.temperatureC}°` : '—'}
            style={{ fontSize: 32, fontWeight: '800', color: palette.text }}
          />
          <TextWidget
            text={content.conditionLabel ?? ''}
            maxLines={1}
            style={{ fontSize: 12, color: palette.textSecondary }}
          />
          <TextWidget
            text={content.placeName}
            maxLines={1}
            style={{ fontSize: 11, color: palette.textSecondary, marginTop: 2 }}
          />
          {minMax ? (
            <TextWidget text={minMax} style={{ fontSize: 11, fontWeight: '600', color: palette.textSecondary }} />
          ) : null}
        </FlexWidget>

        {/* Sağ: öneri başlığı + maddeler */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            paddingLeft: 12,
          }}
        >
          {content.suggestionTitle ? (
            <TextWidget
              text={content.suggestionTitle}
              maxLines={2}
              style={{ fontSize: 14, fontWeight: '700', color: palette.text, marginBottom: 6 }}
            />
          ) : null}
          {(content.suggestionParts ?? []).slice(0, 4).map((part) => (
            <TextWidget
              key={part.label}
              text={`${part.label}: ${part.value}`}
              maxLines={1}
              style={{ fontSize: 11, color: palette.textSecondary, marginTop: 2 }}
            />
          ))}
          {content.staleLabel ? (
            <TextWidget
              text={content.staleLabel}
              style={{ fontSize: 10, color: palette.staleColor, marginTop: 6 }}
            />
          ) : null}
        </FlexWidget>
      </FlexWidget>

      {/* Alt: önümüzdeki 4 saat */}
      {content.hourly.length > 0 ? (
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: 'match_parent',
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: palette.textSecondary,
          }}
        >
          {content.hourly.slice(0, 4).map((point) => (
            <FlexWidget
              key={point.hourLabel}
              style={{ flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <TextWidget text={point.hourLabel} style={{ fontSize: 9, color: palette.textSecondary }} />
              <SvgWidget
                svg={widgetIconSvg(point.iconKey, palette.iconColor)}
                style={{ height: 16, width: 16, marginTop: 2, marginBottom: 2 }}
              />
              <TextWidget
                text={`${point.temperatureC}°`}
                style={{ fontSize: 11, fontWeight: '600', color: palette.text }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}
