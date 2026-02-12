/**
 * EcoHero: Flood Fighters — Title Screen
 *
 * Animated splash with the game logo, a "Play" button, and a
 * profile shortcut. Cartoon-style with floating cloud/leaf animations.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import GameButton from '@/components/game/GameButton';
import { useGame } from '@/context/GameContext';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Shadow,
} from '@/constants/theme';

const { width } = Dimensions.get('window');

// Floating decorative elements
function FloatingEmoji({
  emoji,
  delay,
  startX,
  duration,
}: {
  emoji: string;
  delay: number;
  startX: number;
  duration: number;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      y.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -300,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        {
          left: startX,
          transform: [{ translateY: y }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function TitleScreen() {
  const router = useRouter();
  const { totalStars, player } = useGame();

  // Logo bounce animation
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -12,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#81C784', '#43A047', '#2E7D32']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating decoration */}
      <FloatingEmoji emoji={'\u{1F343}'} delay={0} startX={width * 0.1} duration={4000} />
      <FloatingEmoji emoji={'\u{2601}'} delay={800} startX={width * 0.6} duration={5000} />
      <FloatingEmoji emoji={'\u{1F30A}'} delay={1600} startX={width * 0.35} duration={4500} />
      <FloatingEmoji emoji={'\u{1F331}'} delay={2400} startX={width * 0.8} duration={3800} />
      <FloatingEmoji emoji={'\u{2601}'} delay={600} startX={width * 0.2} duration={5500} />

      {/* Logo area */}
      <Animated.View
        style={[styles.logoContainer, { transform: [{ translateY: bounce }] }]}
      >
        <Text style={styles.logoEmoji}>{'\u{1F30D}'}</Text>
        <Text style={styles.logoTitle}>EcoHero</Text>
        <Text style={styles.logoSubtitle}>Flood Fighters</Text>
      </Animated.View>

      {/* Tagline */}
      <View style={styles.taglineBox}>
        <Text style={styles.tagline}>
          Learn green skills. Save EcoVille!
        </Text>
      </View>

      {/* Stats pill */}
      {totalStars > 0 && (
        <View style={styles.statsPill}>
          <Text style={styles.statsText}>
            {'\u2B50'} {totalStars} stars {'  '} {'\u{1F33F}'}{' '}
            {player.greenScore} Green Score
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttons}>
        <GameButton
          title="Play"
          emoji={'\u{1F3AE}'}
          onPress={() => router.push('/world-map')}
          size="lg"
          color={GameColors.sun}
          textColor={GameColors.primaryDark}
        />

        <GameButton
          title="My Profile"
          emoji={'\u{1F9B8}'}
          onPress={() => router.push('/profile')}
          size="md"
          color="rgba(255,255,255,0.25)"
          textColor="#fff"
        />
      </View>

      <Text style={styles.footer}>
        Mainstreaming Green Skills for Climate Adaptation
      </Text>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 80,
    fontSize: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: Spacing.sm,
  },
  logoTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.title + 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  logoSubtitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: GameColors.sunLight,
    letterSpacing: 1,
    marginTop: -4,
  },
  taglineBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: Spacing.lg,
  },
  tagline: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsPill: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: Spacing.lg,
  },
  statsText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: '#fff',
    fontWeight: '600',
  },
  buttons: {
    gap: Spacing.md,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '600',
  },
});
