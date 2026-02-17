/**
 * EcoHero: Flood Fighters — World Map
 *
 * Shows 4 themed world cards in a vertically scrollable list.
 * Locked worlds appear greyed out. Tapping opens the level list.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import StarRating from '@/components/game/StarRating';
import LanguageToggle from '@/components/game/LanguageToggle';
import {
  WORLDS,
  getLevelsForWorld,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';
import { getWorldStars } from '@/utils/storage';


// ---------------------------------------------------------------------------
// WorldCard
// ---------------------------------------------------------------------------

function WorldCard({
  world,
  unlocked,
  starsEarned,
  totalStars,
  onPress,
}: {
  world: (typeof WORLDS)[number];
  unlocked: boolean;
  starsEarned: number;
  totalStars: number;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;
  const worldTitleKeyMap: Record<string, 'w1Title' | 'w5Title' | 'w7Title' | 'w8Title'> = {
    w1: 'w1Title',
    w5: 'w5Title',
    w7: 'w7Title',
    w8: 'w8Title',
  };
  const worldSubtitleKeyMap: Record<string, 'w1Subtitle' | 'w5Subtitle' | 'w7Subtitle' | 'w8Subtitle'> = {
    w1: 'w1Subtitle',
    w5: 'w5Subtitle',
    w7: 'w7Subtitle',
    w8: 'w8Subtitle',
  };

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={unlocked ? onPress : undefined}
        onPressIn={unlocked ? pressIn : undefined}
        onPressOut={unlocked ? pressOut : undefined}
        style={[styles.card, !unlocked && styles.cardLocked, Shadow.lg]}
      >
        <LinearGradient
          colors={
            unlocked
              ? [world.color, world.gradientEnd]
              : [GameColors.locked, '#CFD8DC']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <Text style={styles.worldEmoji}>
            {unlocked ? world.emoji : '\u{1F512}'}
          </Text>

          <View style={styles.cardContent}>
            <Text style={styles.worldOrder}>
              {t('worldLabel')} {world.order}
            </Text>
            <Text style={styles.worldTitle}>{t(worldTitleKeyMap[world.id] ?? 'w1Title')}</Text>
            <Text style={styles.worldSubtitle}>
              {t(worldSubtitleKeyMap[world.id] ?? 'w1Subtitle')}
            </Text>

            {unlocked ? (
              <View style={styles.starRow}>
                <Text style={styles.starCount}>
                  {'\u2B50'} {starsEarned} / {totalStars}
                </Text>
              </View>
            ) : (
              <Text style={styles.lockText}>
                {'\u{1F512}'} {world.starsToUnlock} {t('starsNeeded')}
              </Text>
            )}
          </View>

          {unlocked && (
            <Text style={styles.arrow}>{'\u276F'}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WorldMapScreen() {
  const router = useRouter();
  const { isWorldUnlocked, player, totalStars } = useGame();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, paddingLeft: insets.left + Spacing.md, paddingRight: insets.right + Spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('worldMap')}</Text>
          <Text style={styles.headerStars}>
            {'\u2B50'} {totalStars} {t('stars')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <LanguageToggle variant="dark" />
          <Pressable onPress={() => router.push('/profile')} style={styles.profileBtn}>
            <Text style={styles.profileEmoji}>{'\u{1F9B8}'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40, paddingHorizontal: Math.max(Spacing.lg, insets.left), paddingRight: Math.max(Spacing.lg, insets.right) }]}
        showsVerticalScrollIndicator={false}
      >
        {WORLDS.map((world) => {
          const unlocked = isWorldUnlocked(world.id);
          const levels = getLevelsForWorld(world.id);
          const earned = getWorldStars(player.levelProgress, world.id);
          const max = levels.length * 3;

          return (
            <WorldCard
              key={world.id}
              world={world}
              unlocked={unlocked}
              starsEarned={earned}
              totalStars={max}
              onPress={() =>
                router.push({
                  pathname: '/levels',
                  params: { worldId: world.id },
                })
              }
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      <StatusBar style="dark" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.7)',
    ...Shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GameColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: GameColors.primaryDark,
  },
  headerStars: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textSecondary,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GameColors.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: { fontSize: 22 },

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // Card
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.7,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 130,
  },
  worldEmoji: {
    fontSize: 48,
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  worldOrder: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  worldTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '900',
    color: '#fff',
  },
  worldSubtitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  starCount: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: '#fff',
    fontWeight: '700',
  },
  lockText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  arrow: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
});
