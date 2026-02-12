/**
 * Animated progress bar with optional label.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { GameColors, Radius, Fonts, FontSizes } from '@/constants/theme';

interface Props {
  progress: number; // 0–1
  color?: string;
  height?: number;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  progress,
  color = GameColors.primaryLight,
  height = 18,
  label,
  showPercent = false,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { width, backgroundColor: color, height },
          ]}
        />
        {showPercent && (
          <Text style={styles.percent}>
            {Math.round(progress * 100)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    backgroundColor: GameColors.starEmpty,
    borderRadius: Radius.round,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    borderRadius: Radius.round,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percent: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    color: GameColors.textLight,
    fontWeight: '700',
    textAlign: 'center',
  },
});
