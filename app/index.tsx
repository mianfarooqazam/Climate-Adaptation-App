/**
 * EcoHero: Flood Fighters — Title Screen
 *
 * Animated splash with the game logo, a "Play" button, and a
 * profile shortcut. Cartoon-style with floating cloud/leaf animations.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const creditsCardHeight = SCREEN_H * 0.5;

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left + Spacing.lg, paddingRight: insets.right + Spacing.lg }]}>
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
      <View style={[styles.langToggle, { top: insets.top + 14 }]}>
        <LanguageToggle />
      </View>

      {/* ---- Main row: Logo left | Buttons right ---- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
            onPress={() => router.push('/intro-conversation')}
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

          {/* Credits (press to show GIZ logo) */}
          <Pressable
            onPress={() => setShowCreditsModal(true)}
            style={({ pressed }) => [styles.creditsPressable, pressed && styles.creditsPressablePressed]}
          >
            <Text style={styles.creditsLabel}>{t('credits')}</Text>
          </Pressable>
        </View>
      </View>
      </ScrollView>

      {/* Credits modal: 50% screen, card UI with close */}
      <Modal
        visible={showCreditsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreditsModal(false)}
      >
        <Pressable style={styles.creditsOverlay} onPress={() => setShowCreditsModal(false)}>
          <Pressable
            style={[styles.creditsCard, { height: creditsCardHeight }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.creditsCardHeader}>
              <Image
                source={require('@/assets/images/GIZ.png')}
                style={styles.creditsHeaderLogo}
                resizeMode="contain"
              />
              <Pressable
                style={({ pressed }) => [styles.creditsCloseBtn, pressed && styles.creditsCloseBtnPressed]}
                onPress={() => setShowCreditsModal(false)}
              >
                <Text style={styles.creditsCloseBtnText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.creditsScroll}
              contentContainerStyle={styles.creditsScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.creditsProjectText}>
                This app was developed under the project <Text style={styles.creditsProjectTextBold}>"Mainstreaming Green Skills for Climate
                Adaptation: Capacity Building and Policy Advocacy in KP"</Text>.{'\n'}Funded by the <Text style={styles.creditsProjectTextBold}>German
                Federal Ministry for Economic Cooperation and Development (BMZ)</Text> and supported by
                the <Text style={styles.creditsProjectTextBold}>Deutsche Gesellschaft für
                Internationale Zusammenarbeit (GIZ) GmbH</Text>.
              </Text>
              <Text style={styles.creditsSdgHeading}>Sustainable Development Goals</Text>
              <View style={styles.creditsSdgRow}>
                <Image source={require('@/assets/sdgs/E_WEB_04.png')} style={styles.creditsSdgImage} resizeMode="contain" />
                <Image source={require('@/assets/sdgs/E_WEB_08.png')} style={styles.creditsSdgImage} resizeMode="contain" />
                <Image source={require('@/assets/sdgs/E_WEB_09.png')} style={styles.creditsSdgImage} resizeMode="contain" />
                <Image source={require('@/assets/sdgs/E_WEB_10.png')} style={styles.creditsSdgImage} resizeMode="contain" />
                <Image source={require('@/assets/sdgs/E_WEB_13.png')} style={styles.creditsSdgImage} resizeMode="contain" />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={[styles.footer, { bottom: insets.bottom + 14 }]}>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
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
  creditsPressable: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  creditsPressablePressed: {
    opacity: 0.7,
  },
  creditsLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  creditsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  creditsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadow.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  creditsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(67, 160, 71, 0.06)',
  },
  creditsHeaderLogo: {
    width: 100,
    height: 40,
  },
  creditsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsCloseBtnPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  creditsCloseBtnText: {
    fontSize: 18,
    color: '#444',
    fontWeight: '600',
  },
  creditsScroll: {
    flex: 1,
  },
  creditsScrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  creditsProjectText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: '#444',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: Spacing.md,
    width: '100%',
  },
  creditsProjectTextBold: {
    fontWeight: '700',
  },
  creditsSdgHeading: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  creditsSdgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  creditsSdgImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
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
