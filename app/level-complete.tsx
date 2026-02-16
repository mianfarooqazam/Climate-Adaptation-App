/**
 * EcoHero: Flood Fighters — Level Complete Screen
 *
 * Shown after finishing a mini-game. Displays:
 * - Star rating with animation
 * - Score
 * - Educational "Did You Know?" fact
 * - Buttons to retry, go to next level, or return to world map
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GameButton from '@/components/game/GameButton';
import StarRating from '@/components/game/StarRating';
import LanguageToggle from '@/components/game/LanguageToggle';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getLevelById,
  getWorldById,
  getLevelsForWorld,
  type Level,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

export default function LevelCompleteScreen() {
  const router = useRouter();
  const { levelId, stars, score, maxScore } = useLocalSearchParams<{
    levelId: string;
    stars: string;
    score: string;
    maxScore: string;
  }>();
  const { isLevelUnlocked } = useGame();
  const { t } = useLanguage();

  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const starCount = parseInt(stars ?? '0', 10);
  const scoreNum = parseInt(score ?? '0', 10);
  const maxScoreNum = parseInt(maxScore ?? '1', 10);

  // Find next level
  const worldLevels = level ? getLevelsForWorld(level.worldId) : [];
  const currentIdx = worldLevels.findIndex((l) => l.id === level?.id);
  const nextLevel: Level | undefined = worldLevels[currentIdx + 1];
  const nextUnlocked = nextLevel ? isLevelUnlocked(nextLevel.id) : false;

  // Animations
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      // Card entrance
      Animated.parallel([
        Animated.spring(containerScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Stars pop
      Animated.spring(starScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 15,
      }),
    ]).start();
  }, []);

  const getMessage = () => {
    if (starCount === 3) return `\u{1F31F} ${t('perfectScore')}`;
    if (starCount === 2) return `\u{1F44F} ${t('greatJob')}`;
    if (starCount === 1) return `\u{1F4AA} ${t('goodEffort')}`;
    return `\u{1F914} ${t('tryAgain')}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          starCount >= 2
            ? ['#FFD600', '#FFC107', '#FF8F00']
            : ['#90CAF9', '#64B5F6', '#42A5F5']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Language toggle */}
      <View style={styles.langToggle}>
        <LanguageToggle />
      </View>

      <Animated.View
        style={[
          styles.card,
          Shadow.lg,
          {
            transform: [{ scale: containerScale }],
            opacity: containerOpacity,
          },
        ]}
      >
        {/* Stars */}
        <Animated.View style={{ transform: [{ scale: starScale }] }}>
          <StarRating stars={starCount} size={44} />
        </Animated.View>

        {/* Message */}
        <Text style={styles.message}>{getMessage()}</Text>

        {/* Score */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>{t('score')}</Text>
          <Text style={styles.scoreValue}>
            {scoreNum} / {maxScoreNum}
          </Text>
        </View>

        {/* Level name */}
        <Text style={styles.levelName}>
          {levelId === 'w1-l1'
            ? t('roofShield')
            : levelId === 'w1-l2'
            ? t('hotWalls')
            : levelId === 'w1-l3'
            ? t('fullProtection')
            : levelId === 'w5-l1'
            ? t('learnLayersTitle')
            : levelId === 'w5-l2'
            ? t('addRightWindowTitle')
            : levelId === 'w8-l1'
            ? t('roofGardenLevelTitle')
            : level?.title ?? 'Level'}
        </Text>
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {nextLevel && nextUnlocked && (
          <GameButton
            title={t('nextLevel')}
            emoji={'\u{27A1}'}
            onPress={() => {
              const typeRoute: Record<string, string> = {
                quiz: '/quiz',
                'flood-defense': '/flood-defense',
                'eco-builder': '/eco-builder',
                sorting: '/sorting',
                'insulation-game': '/insulation-game',
                'windows-game': '/windows-game',
                'roof-garden-game': '/roof-garden-game',
                'build-home': '/build-home',
              };
              router.replace({
                pathname: typeRoute[nextLevel.type] as any,
                params: { levelId: nextLevel.id },
              });
            }}
            color={GameColors.primary}
            size="md"
          />
        )}

        <GameButton
          title={t('retry')}
          emoji={'\u{1F504}'}
          onPress={() => {
            const typeRoute: Record<string, string> = {
              quiz: '/quiz',
              'flood-defense': '/flood-defense',
              'eco-builder': '/eco-builder',
              sorting: '/sorting',
              'insulation-game': '/insulation-game',
              'windows-game': '/windows-game',
              'build-home': '/build-home',
            };
            router.replace({
              pathname: typeRoute[level?.type ?? 'quiz'] as any,
              params: { levelId: levelId ?? '' },
            });
          }}
          color={GameColors.sun}
          textColor={GameColors.primaryDark}
          size="md"
        />

        <GameButton
          title={t('worldMapBtn')}
          emoji={'\u{1F5FA}'}
          onPress={() => router.replace('/world-map')}
          color="rgba(255,255,255,0.3)"
          textColor="#fff"
          size="md"
        />
      </View>
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
  langToggle: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: Spacing.md,
  },
  message: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    color: GameColors.textPrimary,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  scoreLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: GameColors.textMuted,
  },
  scoreValue: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: GameColors.water,
  },
  levelName: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: GameColors.textMuted,
  },

  // Buttons
  buttons: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
});
