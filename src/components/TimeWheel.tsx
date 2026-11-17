import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface TimeWheelProps {
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Tek sütunluk iOS tarzı kaydırmalı tekerlek. */
function WheelColumn({
  values,
  selected,
  onSelect,
  label,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  label: string;
}) {
  const theme = useAppTheme();
  const initialIndex = Math.max(values.indexOf(selected), 0);

  const handleMomentumEnd = (event: { nativeEvent: { contentOffset: { y: number } } }): void => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.min(Math.max(index, 0), values.length - 1);
    const value = values[clamped];
    if (value !== undefined && value !== selected) {
      onSelect(value);
    }
  };

  return (
    <View style={styles.column}>
      <Text style={[typography.micro, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.wheelClip, { height: WHEEL_HEIGHT }]}>
        {/* Merkez seçim bandı */}
        <View
          pointerEvents="none"
          style={[
            styles.band,
            {
              top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,40,70,0.06)',
            },
          ]}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
          onMomentumScrollEnd={handleMomentumEnd}
          contentContainerStyle={{
            paddingVertical: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
          }}
        >
          {values.map((value) => {
            const active = value === selected;
            return (
              <View key={value} style={[styles.item, { height: ITEM_HEIGHT }]}>
                <Text
                  style={[
                    typography.titleM,
                    {
                      color: active ? theme.text : theme.textSecondary,
                      fontWeight: active ? '700' : '500',
                      opacity: active ? 1 : 0.55,
                    },
                  ]}
                >
                  {pad2(value)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/** 24 saat formatında saat + dakika seçici (00:00–23:59). */
export function TimeWheel({ hour, minute, onChange }: TimeWheelProps) {
  const theme = useAppTheme();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View style={styles.row}>
      <WheelColumn
        values={hours}
        selected={hour}
        onSelect={(h) => onChange(h, minute)}
        label="SS"
      />
      <Text style={[typography.titleL, { color: theme.textSecondary }]}>:</Text>
      <WheelColumn
        values={minutes}
        selected={minute}
        onSelect={(m) => onChange(hour, m)}
        label="DD"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  column: {
    alignItems: 'center',
  },
  wheelClip: {
    width: 76,
    overflow: 'hidden',
    borderRadius: radius.card,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: radius.sm,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
