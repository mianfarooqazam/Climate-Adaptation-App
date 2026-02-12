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
};

const TYPE_EMOJI: Record<MiniGameType, string> = {
  quiz: '\u{1F9E0}',              // 🧠
  'flood-defense': '\u{1F30A}',    // 🌊
  'eco-builder': '\u{1F3D7}',     // 🏗
  sorting: '\u{267B}',            // ♻
  'insulation-game': '\u{1F3E0}', // 🏠
};

const TYPE_LABEL_EN: Record<MiniGameType, string> = {
  quiz: 'Quiz',
  'flood-defense': 'Flood Defense',
  'eco-builder': 'Eco Builder',
  sorting: 'Sort & Recycle',
  'insulation-game': 'Insulation',
};

// Maps for insulation world translated titles & descriptions
const LEVEL_TITLE_KEY: Record<string, 'roofShield' | 'hotWalls' | 'fullProtection'> = {
  'w1-l1': 'roofShield',
  'w1-l2': 'hotWalls',
  'w1-l3': 'fullProtection',
};
const LEVEL_DESC_KEY: Record<string, 'roofShieldDesc' | 'hotWallsDesc' | 'fullProtectionDesc'> = {
  'w1-l1': 'roofShieldDesc',
  'w1-l2': 'hotWallsDesc',
  'w1-l3': 'fullProtectionDesc',
};

export default function LevelsScreen() {
  const router = useRouter();
  const { worldId } = useLocalSearchParams<{ worldId: string }>();
  const { player, isLevelUnlocked } = useGame();
  const { t, lang } = useLanguage();

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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{world.emoji}</Text>
          <Text style={styles.headerTitle}>{worldId === 'w1' ? t('w1Title') : world.title}</Text>
          <Text style={styles.headerSubtitle}>{worldId === 'w1' ? t('w1Subtitle') : world.subtitle}</Text>
        </View>
        <LanguageToggle />
      </View>

      {/* Levels list */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                  {level.type === 'insulation-game' ? t('typeInsulation') : TYPE_LABEL_EN[level.type]} {'  '}
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
            {worldId === 'w1' ? t('w1Description') : world.description}
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
