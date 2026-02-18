/**
 * EcoHero: Flood Fighters — Level Selection
 *
 * Shows levels for a selected world. Each level button shows its type icon,
 * title, difficulty, and star rating. Locked levels are greyed out.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import StarRating from '@/components/game/StarRating';
import LanguageToggle from '@/components/game/LanguageToggle';
import {
  getWorldById,
  getLevelsForWorld,
  type MiniGameType,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

// Mini-game type → route mapping
const TYPE_ROUTE: Record<MiniGameType, string> = {
  quiz: '/quiz',
  'flood-defense': '/flood-defense',
  'eco-builder': '/eco-builder',
  sorting: '/sorting',
  'insulation-game': '/insulation-game',
  'windows-game': '/windows-game',
  'roof-garden-game': '/roof-garden-game',
  'build-home': '/build-home',
};

const TYPE_EMOJI: Record<MiniGameType, string> = {
  quiz: '\u{1F9E0}',              // 🧠
  'flood-defense': '\u{1F30A}',   // 🌊
  'eco-builder': '\u{1F3D7}',     // 🏗
  sorting: '\u{267B}',            // ♻
  'insulation-game': '\u{1F3E0}', // 🏠
  'windows-game': '\u{1FA9F}',    // 🪟
  'roof-garden-game': '\u{1F33B}', // 🌻
  'build-home': '\u{1F3D7}',      // 🏗
};

const TYPE_LABEL_EN: Record<MiniGameType, string> = {
  quiz: 'Quiz',
  'flood-defense': 'Flood Defense',
  'eco-builder': 'Eco Builder',
  sorting: 'Sort & Recycle',
  'insulation-game': 'Insulation',
  'windows-game': 'Windows',
  'roof-garden-game': 'Roof Garden',
  'build-home': 'Build Home',
};

// Maps for insulation world translated titles & descriptions
const LEVEL_TITLE_KEY: Record<string, 'whatIsInsulationTitle' | 'roofShield' | 'hotWalls' | 'fullProtection' | 'learnLayersTitle' | 'addRightWindowTitle' | 'buildHomeExplore' | 'roofGardenLevelTitle'> = {
  'w1-l0': 'whatIsInsulationTitle',
  'w1-l1': 'roofShield',
  'w1-l2': 'hotWalls',
  'w1-l3': 'fullProtection',
  'w5-l1': 'learnLayersTitle',
  'w5-l2': 'addRightWindowTitle',
  'w7-l1': 'buildHomeExplore',
  'w8-l1': 'roofGardenLevelTitle',
};
const WORLD_TITLE_KEY: Record<string, 'w1Title' | 'w5Title' | 'w7Title' | 'w8Title'> = {
  w1: 'w1Title',
  w5: 'w5Title',
  w7: 'w7Title',
  w8: 'w8Title',
};
const WORLD_SUBTITLE_KEY: Record<string, 'w1Subtitle' | 'w5Subtitle' | 'w7Subtitle' | 'w8Subtitle'> = {
  w1: 'w1Subtitle',
  w5: 'w5Subtitle',
  w7: 'w7Subtitle',
  w8: 'w8Subtitle',
};
const WORLD_DESC_KEY: Record<string, 'w1Description' | 'w5Description' | 'w7Description' | 'w8Description'> = {
  w1: 'w1Description',
  w5: 'w5Description',
  w7: 'w7Description',
  w8: 'w8Description',
};

export default function LevelsScreen() {
  const router = useRouter();
  const { worldId } = useLocalSearchParams<{ worldId: string }>();
  const { player, isLevelUnlocked } = useGame();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();

  const world = getWorldById(worldId ?? 'w1');
  const levels = getLevelsForWorld(worldId ?? 'w1');

  if (!world) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[world.color, world.gradientEnd, '#E8F5E9']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, paddingLeft: insets.left + Spacing.md, paddingRight: insets.right + Spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{world.emoji}</Text>
          <Text style={styles.headerTitle}>{t(WORLD_TITLE_KEY[worldId ?? 'w1'] ?? 'w1Title')}</Text>
          <Text style={styles.headerSubtitle}>{t(WORLD_SUBTITLE_KEY[worldId ?? 'w1'] ?? 'w1Subtitle')}</Text>
        </View>
        <LanguageToggle />
      </View>

      {/* Levels list */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl, paddingLeft: Math.max(Spacing.lg, insets.left), paddingRight: Math.max(Spacing.lg, insets.right) }]}
        showsVerticalScrollIndicator={false}
      >
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level.id);
          const progress = player.levelProgress[level.id];
          const stars = progress?.stars ?? 0;

          return (
            <Pressable
              key={level.id}
              onPress={() => {
                if (!unlocked) return;
                router.push({
                  pathname: TYPE_ROUTE[level.type] as any,
                  params: { levelId: level.id },
                });
              }}
              style={[
                styles.levelCard,
                !unlocked && styles.levelLocked,
                Shadow.md,
              ]}
            >
              {/* Type icon */}
              <View
                style={[
                  styles.typeIcon,
                  {
                    backgroundColor: unlocked
                      ? world.color
                      : GameColors.locked,
                  },
                ]}
              >
                <Text style={styles.typeEmoji}>
                  {unlocked ? TYPE_EMOJI[level.type] : '\u{1F512}'}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.levelInfo}>
                <Text
                  style={[
                    styles.levelTitle,
                    !unlocked && { color: GameColors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {LEVEL_TITLE_KEY[level.id] ? t(LEVEL_TITLE_KEY[level.id]) : level.title}
                </Text>
                <Text style={styles.levelType}>
                  {level.type === 'insulation-game' ? t('typeInsulation') : level.type === 'windows-game' ? t('typeWindows') : level.type === 'roof-garden-game' ? t('typeRoofGarden') : TYPE_LABEL_EN[level.type]} {'  '}
                  {Array.from({ length: level.difficulty })
                    .map(() => '\u{1F525}')
                    .join('')}
                </Text>
              </View>

              {/* Stars */}
              {unlocked && <StarRating stars={stars} size={20} />}
            </Pressable>
          );
        })}

        {/* World description */}
        <View style={styles.descriptionBox}>
          <Text style={[styles.descriptionText, lang === 'ur' && { writingDirection: 'rtl' }]}>
            {t(WORLD_DESC_KEY[worldId ?? 'w1'] ?? 'w1Description')}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEmoji: { fontSize: 36 },
  headerTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '900',
    color: '#fff',
  },
  headerSubtitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Level card
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  levelLocked: {
    opacity: 0.55,
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: { fontSize: 26 },
  levelInfo: { flex: 1 },
  levelTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: GameColors.textPrimary,
  },
  levelType: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    color: GameColors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },

  // Description
  descriptionBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  descriptionText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
