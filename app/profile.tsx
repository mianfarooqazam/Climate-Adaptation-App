/**
 * EcoHero: Flood Fighters — Player Profile Screen
 *
 * Displays the player's progress:
 * - Green Score, total stars, levels completed
 * - Badge collection
 * - Reset progress option
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import BadgeView from '@/components/game/Badge';
import GameButton from '@/components/game/GameButton';
import LanguageToggle from '@/components/game/LanguageToggle';
import ProgressBar from '@/components/game/ProgressBar';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import { BADGES, LEVELS, WORLDS, getLevelsForWorld } from '@/constants/gameData';
import { getTotalStars } from '@/utils/storage';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { player, totalStars, resetProgress } = useGame();
  const { t } = useLanguage();

  const completedLevels = Object.values(player.levelProgress).filter(
    (lp) => lp.completed,
  ).length;
  const totalLevels = LEVELS.length;
  const maxStars = totalLevels * 3;
  const worldTitleKeyMap: Record<string, 'w1Title' | 'w5Title'> = {
    w1: 'w1Title',
    w5: 'w5Title',
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure? This will erase all your progress, stars, and badges.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('myProfile')}</Text>
        <LanguageToggle variant="dark" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Name */}
        <View style={[styles.avatarCard, Shadow.lg]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{'\u{1F9B8}'}</Text>
          </View>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerTitle}>EcoHero in Training</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statEmoji}>{'\u{1F33F}'}</Text>
            <Text style={styles.statValue}>{player.greenScore}</Text>
            <Text style={styles.statLabel}>{t('greenScore')}</Text>
          </View>
          <View style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statEmoji}>{'\u2B50'}</Text>
            <Text style={styles.statValue}>{totalStars}</Text>
            <Text style={styles.statLabel}>{t('stars')}</Text>
          </View>
          <View style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statEmoji}>{'\u2705'}</Text>
            <Text style={styles.statValue}>{completedLevels}</Text>
            <Text style={styles.statLabel}>Levels Done</Text>
          </View>
          <View style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statEmoji}>{'\u{1F9E0}'}</Text>
            <Text style={styles.statValue}>
              {player.totalCorrectAnswers}
            </Text>
            <Text style={styles.statLabel}>Correct Answers</Text>
          </View>
        </View>

        {/* Overall progress */}
        <View style={[styles.progressSection, Shadow.sm]}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <ProgressBar
            progress={completedLevels / totalLevels}
            color={GameColors.primaryLight}
            height={14}
            showPercent
            label={`${completedLevels} of ${totalLevels} levels completed`}
          />
          <View style={{ height: Spacing.md }} />
          <ProgressBar
            progress={totalStars / maxStars}
            color={GameColors.star}
            height={14}
            showPercent
            label={`${totalStars} of ${maxStars} stars earned`}
          />
        </View>

        {/* World progress */}
        <View style={[styles.progressSection, Shadow.sm]}>
          <Text style={styles.sectionTitle}>World Progress</Text>
          {WORLDS.map((world) => {
            const levels = getLevelsForWorld(world.id);
            const completed = levels.filter(
              (l) => player.levelProgress[l.id]?.completed,
            ).length;
            return (
              <View key={world.id} style={styles.worldProgressRow}>
                <Text style={styles.worldProgressEmoji}>
                  {world.emoji}
                </Text>
                <View style={styles.worldProgressInfo}>
                  <Text style={styles.worldProgressName}>
                    {t(worldTitleKeyMap[world.id] ?? 'w1Title')}
                  </Text>
                  <ProgressBar
                    progress={completed / levels.length}
                    color={world.color}
                    height={10}
                  />
                </View>
                <Text style={styles.worldProgressCount}>
                  {completed}/{levels.length}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Badges */}
        <View style={[styles.badgeSection, Shadow.sm]}>
          <Text style={styles.sectionTitle}>
            {'\u{1F3C5}'} {t('badges')} ({player.badges.length}/{BADGES.length})
          </Text>
          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => (
              <BadgeView
                key={badge.id}
                emoji={badge.emoji}
                name={badge.name}
                earned={player.badges.includes(badge.id)}
              />
            ))}
          </View>
        </View>

        {/* Reset */}
        <View style={styles.resetArea}>
          <GameButton
            title={t('resetProgress')}
            onPress={handleReset}
            color={GameColors.danger}
            size="sm"
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: GameColors.primaryDark,
  },

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // Avatar card
  avatarCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: GameColors.sunLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: GameColors.sun,
  },
  avatarEmoji: { fontSize: 44 },
  playerName: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: GameColors.textPrimary,
  },
  playerTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: GameColors.textMuted,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: '45%',
  },
  statEmoji: { fontSize: 28 },
  statValue: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    color: GameColors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: GameColors.textMuted,
    textAlign: 'center',
  },

  // Progress
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: GameColors.textPrimary,
    marginBottom: Spacing.md,
  },
  worldProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  worldProgressEmoji: { fontSize: 28 },
  worldProgressInfo: { flex: 1 },
  worldProgressName: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: GameColors.textSecondary,
    marginBottom: 4,
  },
  worldProgressCount: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: GameColors.textPrimary,
    width: 40,
    textAlign: 'right',
  },

  // Badges
  badgeSection: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },

  // Reset
  resetArea: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
