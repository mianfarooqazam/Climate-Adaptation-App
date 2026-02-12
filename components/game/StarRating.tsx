/**
 * Displays 1–3 stars. Filled stars use gold colour; empty stars are grey.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameColors } from '@/constants/theme';

interface Props {
  stars: number; // 0–3
  size?: number;
}

export default function StarRating({ stars, size = 28 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size, color: i <= stars ? GameColors.star : GameColors.starEmpty },
          ]}
        >
          {'\u2B50'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
