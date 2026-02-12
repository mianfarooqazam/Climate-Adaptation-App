/**
 * Animated thermometer that shows house temperature.
 *
 * The mercury level and colour smoothly animate when temperature changes.
 * - Hot (38 °C+): red, sweating emoji
 * - Warm (28–37 °C): orange
 * - Comfortable (20–27 °C): green, happy emoji
 * - Cool (< 20 °C): blue, snowflake
 *
 * The tube is drawn vertically with a bulb at the bottom.
 * Tick marks along the side give it a real thermometer feel.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameColors, Fonts, FontSizes, Radius, Shadow } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TUBE_HEIGHT = 180;
const TUBE_WIDTH = 28;
const BULB_SIZE = 42;
const TICK_COUNT = 8;

const MIN_TEMP = 10;
const MAX_TEMP = 42;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a temperature to a 0–1 fill ratio. */
function tempToFill(temp: number): number {
  const clamped = Math.max(MIN_TEMP, Math.min(MAX_TEMP, temp));
  return (clamped - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
}

/** Pick a colour based on temperature. */
function tempColor(temp: number): string {
  if (temp >= 36) return '#D32F2F';     // hot red
  if (temp >= 32) return '#F44336';     // red
  if (temp >= 28) return '#FF9800';     // orange
  if (temp >= 24) return '#FFC107';     // warm yellow
  if (temp >= 20) return '#66BB6A';     // comfortable green
  return '#42A5F5';                     // cool blue
}

/** Pick a status emoji + label for the current temperature. */
function tempStatus(temp: number): { emoji: string; label: string } {
  if (temp >= 36) return { emoji: '\u{1F975}', label: 'Overheating!' };
  if (temp >= 32) return { emoji: '\u{1F525}', label: 'Very Hot' };
  if (temp >= 28) return { emoji: '\u{2600}\u{FE0F}', label: 'Hot' };
  if (temp >= 24) return { emoji: '\u{1F321}\u{FE0F}', label: 'Warm' };
  if (temp >= 20) return { emoji: '\u{1F60A}', label: 'Comfortable' };
  return { emoji: '\u{2744}\u{FE0F}', label: 'Cool' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  /** Current temperature in °C. */
  temperature: number;
  /** Optional style wrapper. */
  style?: object;
}

export default function Thermometer({ temperature, style }: Props) {
  const fill = tempToFill(temperature);
  const color = tempColor(temperature);
  const status = tempStatus(temperature);

  // Animated values
  const animFill = useRef(new Animated.Value(fill)).current;
  const animColor = useRef(new Animated.Value(temperature)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Animate mercury height
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFill, {
        toValue: fill,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animColor, {
        toValue: temperature,
        duration: 700,
        useNativeDriver: false,
      }),
    ]).start();

    // Quick pulse on temperature label when it changes
    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(pulseScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
    ]).start();
  }, [temperature]);

  // Derived animated styles
  const mercuryHeight = animFill.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TUBE_HEIGHT],
  });

  const mercuryColor = animColor.interpolate({
    inputRange: [MIN_TEMP, 20, 24, 28, 32, MAX_TEMP],
    outputRange: ['#42A5F5', '#66BB6A', '#FFC107', '#FF9800', '#F44336', '#D32F2F'],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Status emoji */}
      <Text style={styles.statusEmoji}>{status.emoji}</Text>

      {/* Temperature reading */}
      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Text style={[styles.tempText, { color }]}>
          {Math.round(temperature)}°C
        </Text>
      </Animated.View>

      {/* Tube + Bulb assembly */}
      <View style={styles.thermBody}>
        {/* Tick marks */}
        <View style={styles.tickColumn}>
          {Array.from({ length: TICK_COUNT + 1 }).map((_, i) => {
            const t = MAX_TEMP - ((MAX_TEMP - MIN_TEMP) / TICK_COUNT) * i;
            return (
              <View key={i} style={styles.tickRow}>
                <Text style={styles.tickLabel}>{Math.round(t)}°</Text>
                <View style={styles.tickMark} />
              </View>
            );
          })}
        </View>

        {/* Glass tube */}
        <View style={[styles.tube, Shadow.sm]}>
          {/* Background (empty) */}
          <View style={styles.tubeInner}>
            {/* Mercury fill (animated from bottom) */}
            <Animated.View
              style={[
                styles.mercury,
                {
                  height: mercuryHeight,
                  backgroundColor: mercuryColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Bulb */}
        <Animated.View
          style={[
            styles.bulb,
            { backgroundColor: mercuryColor },
            Shadow.sm,
          ]}
        />
      </View>

      {/* Status label */}
      <Text style={[styles.statusLabel, { color }]}>
        {status.label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  statusEmoji: {
    fontSize: 28,
  },
  tempText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '900',
  },

  // Tube + bulb wrapper
  thermBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  // Tick marks column (to the left of the tube)
  tickColumn: {
    height: TUBE_HEIGHT,
    justifyContent: 'space-between',
    marginRight: 4,
    paddingVertical: 2,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: GameColors.textMuted,
    width: 22,
    textAlign: 'right',
    marginRight: 2,
  },
  tickMark: {
    width: 6,
    height: 1.5,
    backgroundColor: GameColors.textMuted,
    borderRadius: 1,
  },

  // Glass tube
  tube: {
    width: TUBE_WIDTH,
    height: TUBE_HEIGHT,
    borderRadius: TUBE_WIDTH / 2,
    backgroundColor: '#ECEFF1',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#CFD8DC',
  },
  tubeInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mercury: {
    width: '100%',
    borderTopLeftRadius: TUBE_WIDTH / 2,
    borderTopRightRadius: TUBE_WIDTH / 2,
  },

  // Bulb at the bottom
  bulb: {
    width: BULB_SIZE,
    height: BULB_SIZE,
    borderRadius: BULB_SIZE / 2,
    marginLeft: -(TUBE_WIDTH / 2) - 1,
    marginBottom: -4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  statusLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginTop: 2,
  },
});
