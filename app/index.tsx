/**
 * EcoHero: Flood Fighters — Title Screen
 *
 * Animated splash with the game logo, a "Play" button, and a
 * profile shortcut. Cartoon-style with floating cloud/leaf animations.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GameButton from '@/components/game/GameButton';
import {
  FontSizes,
  Fonts,
  GameColors,
  Spacing
} from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

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

const MOBILE_BREAKPOINT = 420;

export default function TitleScreen() {
  const router = useRouter();
  useGame();
  const { t } = useLanguage();
  const { width: SCREEN_W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = SCREEN_W < MOBILE_BREAKPOINT;

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left + (isMobile ? Spacing.sm : Spacing.lg), paddingRight: insets.right + (isMobile ? Spacing.sm : Spacing.lg) }]}>
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

      {/* GIZ logo — top left */}
      <View style={[styles.topLeftLogo, { top: insets.top + (isMobile ? 8 : 14), left: insets.left + (isMobile ? Spacing.sm : Spacing.lg) }]}>
        <Image
          source={require('@/assets/images/GIZ.png')}
          style={[styles.gizLogo, isMobile && styles.gizLogoMobile]}
          resizeMode="contain"
        />
      </View>

      {/* SDGs (top-right) */}
      <View style={[styles.sdgTopRight, { top: insets.top + (isMobile ? 8 : 14), right: insets.right + (isMobile ? Spacing.sm : Spacing.lg) }]}>
        <View style={styles.sdgRow}>
          <Image source={require('@/assets/sdgs/E_WEB_04.png')} style={[styles.sdgImage, isMobile && styles.sdgImageMobile]} resizeMode="contain" />
          <Image source={require('@/assets/sdgs/E_WEB_08.png')} style={[styles.sdgImage, isMobile && styles.sdgImageMobile]} resizeMode="contain" />
          <Image source={require('@/assets/sdgs/E_WEB_09.png')} style={[styles.sdgImage, isMobile && styles.sdgImageMobile]} resizeMode="contain" />
          <Image source={require('@/assets/sdgs/E_WEB_10.png')} style={[styles.sdgImage, isMobile && styles.sdgImageMobile]} resizeMode="contain" />
          <Image source={require('@/assets/sdgs/E_WEB_13.png')} style={[styles.sdgImage, isMobile && styles.sdgImageMobile]} resizeMode="contain" />
        </View>
      </View>

      {/* ---- Main: logo + buttons (column on mobile, row on larger) ---- */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
          { paddingBottom: isMobile ? 220 : 200 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View style={[styles.mainRow, isMobile && styles.mainRowMobile]}>
        {/* Branding */}
        <View style={[styles.leftSide, isMobile && styles.leftSideMobile]}>
          <Animated.View
            style={[styles.logoContainer, isMobile && styles.logoContainerMobile, { transform: [{ translateY: bounce }] }]}
          >
            <Text style={[styles.logoEmoji, isMobile && styles.logoEmojiMobile]}>{'\u{1F30D}'}</Text>
            <Text style={[styles.logoTitle, isMobile && styles.logoTitleMobile]} numberOfLines={2}>
              {t('appTitle')}
            </Text>
          </Animated.View>
        </View>

        {/* Buttons */}
        <View style={[styles.rightSide, isMobile && styles.rightSideMobile]}>
          <GameButton
            title={t('play')}
            emoji={'\u{1F3AE}'}
            onPress={() => router.push('/intro-conversation')}
            size={isMobile ? 'md' : 'lg'}
            color={GameColors.sun}
            textColor={GameColors.primaryDark}
          />

          <GameButton
            title={t('myProfile')}
            emoji={'\u{1F9B8}'}
            onPress={() => router.push('/profile')}
            size={isMobile ? 'md' : 'lg'}
            color="#757575"
            textColor="#fff"
          />
        </View>
      </View>
      </ScrollView>

      {/* Bottom: credits text */}
      <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + 14, paddingLeft: insets.left + (isMobile ? Spacing.md : Spacing.lg), paddingRight: insets.right + (isMobile ? Spacing.md : Spacing.lg) }]}>
        <View style={[styles.creditsBox, isMobile && styles.creditsBoxMobile]}>
          <ScrollView
            style={[styles.creditsScrollInline, isMobile && styles.creditsScrollInlineMobile]}
            contentContainerStyle={styles.creditsScrollContentInline}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.creditsProjectText, isMobile && styles.creditsProjectTextMobile]}>
              This app is developed under the project <Text style={styles.creditsProjectTextBold}>"Mainstreaming Green Skills for Climate
              Adaptation: Capacity Building and Policy Advocacy in KP"</Text>. Funded by the <Text style={styles.creditsProjectTextBold}>German
              Federal Ministry for Economic Cooperation and Development (BMZ)</Text> and supported by
              the <Text style={styles.creditsProjectTextBold}>Deutsche Gesellschaft für
              Internationale Zusammenarbeit (GIZ) GmbH</Text>.
            </Text>
          </ScrollView>
        </View>
      </View>

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
  scrollContentMobile: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingTop: 56,
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 40,
    fontSize: 28,
  },

  /* --- Main layout: row on wide, column on mobile --- */
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 700,
    gap: Spacing.xl,
  },
  mainRowMobile: {
    flexDirection: 'column',
    gap: Spacing.md,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  leftSide: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  leftSideMobile: {
    flex: 0,
    width: '100%',
  },
  rightSide: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 0,
  },
  rightSideMobile: {
    flex: 0,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },

  /* --- Logo --- */
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logoContainerMobile: {
    marginBottom: Spacing.xs,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: Spacing.xs,
  },
  logoEmojiMobile: {
    fontSize: 36,
  },
  logoTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.title,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  logoTitleMobile: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  topLeftLogo: {
    position: 'absolute',
    zIndex: 10,
  },
  gizLogo: {
    width: 100,
    height: 40,
  },
  gizLogoMobile: {
    width: 72,
    height: 28,
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  creditsBox: {
    maxHeight: 100,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  creditsBoxMobile: {
    maxHeight: 72,
    marginBottom: Spacing.xs,
  },
  creditsScrollInline: {
    maxHeight: 80,
  },
  creditsScrollInlineMobile: {
    maxHeight: 58,
  },
  creditsScrollContentInline: {
    paddingVertical: 2,
  },
  creditsProjectText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: '#fff',
    textAlign: 'justify',
    lineHeight: 20,
    width: '100%',
  },
  creditsProjectTextMobile: {
    fontSize: 7,
    lineHeight: 11,
  },
  creditsProjectTextBold: {
    fontWeight: '700',
  },
  sdgTopRight: {
    position: 'absolute',
    zIndex: 10,
  },
  sdgRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  sdgImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  sdgImageMobile: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
});
