/**
 * Badge component — shows an earned (or locked) badge.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameColors, Radius, Spacing, FontSizes, Shadow, Fonts } from '@/constants/theme';

interface Props {
  emoji: string;
  name: string;
  earned: boolean;
  size?: number;
}

export default function BadgeView({ emoji, name, earned, size = 60 }: Props) {
  return (
    <View style={[styles.container, !earned && styles.locked]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: earned ? GameColors.sun : GameColors.starEmpty,
          },
          earned && Shadow.sm,
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>
          {earned ? emoji : '\u{1F512}'}
        </Text>
      </View>
      <Text
        style={[
          styles.name,
          { color: earned ? GameColors.textPrimary : GameColors.textMuted },
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    gap: Spacing.xs,
  },
  locked: {
    opacity: 0.5,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  emoji: {
    textAlign: 'center',
  },
  name: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
});
