/**
 * Cartoon-style game button with press animation.
 */

import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { GameColors, Radius, Spacing, FontSizes, Shadow, Fonts } from '@/constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  emoji?: string;
  style?: ViewStyle;
}

export default function GameButton({
  title,
  onPress,
  color = GameColors.primary,
  textColor = GameColors.textLight,
  size = 'md',
  disabled = false,
  emoji,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const sizeStyles: Record<string, { btn: ViewStyle; txt: TextStyle }> = {
    sm: {
      btn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
      txt: { fontSize: FontSizes.sm },
    },
    md: {
      btn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
      txt: { fontSize: FontSizes.lg },
    },
    lg: {
      btn: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
      txt: { fontSize: FontSizes.xl },
    },
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          sizeStyles[size].btn,
          { backgroundColor: disabled ? GameColors.locked : color },
          Shadow.md,
          style,
        ]}
      >
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Text
          style={[
            styles.text,
            sizeStyles[size].txt,
            { color: disabled ? '#fff' : textColor },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  text: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emoji: {
    fontSize: 22,
  },
});
