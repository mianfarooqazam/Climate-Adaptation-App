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
import LanguageToggle from '@/components/game/LanguageToggle';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Shadow,
} from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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
            toValue: -250,
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
  const { t } = useLanguage();

  // Logo bounce animation
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -8,
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
      <FloatingEmoji emoji={'\u{1F343}'} delay={0} startX={SCREEN_W * 0.05} duration={4000} />
      <FloatingEmoji emoji={'\u{2601}'} delay={800} startX={SCREEN_W * 0.55} duration={5000} />
      <FloatingEmoji emoji={'\u{1F30A}'} delay={1600} startX={SCREEN_W * 0.3} duration={4500} />
      <FloatingEmoji emoji={'\u{1F331}'} delay={2400} startX={SCREEN_W * 0.85} duration={3800} />
      <FloatingEmoji emoji={'\u{2601}'} delay={600} startX={SCREEN_W * 0.15} duration={5500} />

      {/* Language toggle (top-right) */}
      <View style={styles.langToggle}>
        <LanguageToggle />
      </View>

      {/* ---- Main row: Logo left | Buttons right ---- */}
      <View style={styles.mainRow}>
        {/* Left side: branding */}
        <View style={styles.leftSide}>
          <Animated.View
            style={[styles.logoContainer, { transform: [{ translateY: bounce }] }]}
          >
            <Text style={styles.logoEmoji}>{'\u{1F30D}'}</Text>
            <Text style={styles.logoTitle}>{t('appTitle')}</Text>
            <Text style={styles.logoSubtitle}>{t('appSubtitle')}</Text>
          </Animated.View>

          {/* Tagline */}
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>
              {t('tagline')}
            </Text>
          </View>
        </View>

        {/* Right side: stats + buttons */}
        <View style={styles.rightSide}>
          {/* Stats pill */}
          {totalStars > 0 && (
            <View style={styles.statsPill}>
              <Text style={styles.statsText}>
                {'\u2B50'} {totalStars} {t('stars')} {'  '} {'\u{1F33F}'}{' '}
                {player.greenScore} {t('greenScore')}
              </Text>
            </View>
          )}

          <GameButton
            title={t('play')}
            emoji={'\u{1F3AE}'}
            onPress={() => router.push('/world-map')}
            size="lg"
            color={GameColors.sun}
            textColor={GameColors.primaryDark}
          />

          <GameButton
            title={t('myProfile')}
            emoji={'\u{1F9B8}'}
            onPress={() => router.push('/profile')}
            size="md"
            color="rgba(255,255,255,0.25)"
            textColor="#fff"
          />
        </View>
      </View>

      <Text style={styles.footer}>
        {t('footer')}
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
    bottom: 40,
    fontSize: 28,
  },

  /* --- Landscape row layout --- */
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 700,
    gap: Spacing.xl,
  },
  leftSide: {
    flex: 1,
    alignItems: 'center',
  },
  rightSide: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.md,
  },

  /* --- Logo --- */
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: Spacing.xs,
  },
  logoTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.title,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  logoSubtitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl - 2,
    fontWeight: '700',
    color: GameColors.sunLight,
    letterSpacing: 1,
    marginTop: -2,
  },
  taglineBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
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
    paddingVertical: 6,
  },
  statsText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: '#fff',
    fontWeight: '600',
  },
  langToggle: {
    position: 'absolute',
    top: 14,
    right: 20,
    zIndex: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '600',
  },
});
