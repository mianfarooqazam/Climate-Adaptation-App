/**
 * EcoHero: Flood Fighters — Game State Context
 *
 * Provides global game state (player progress, scores, badges) through
 * React Context so every screen can read/update progress.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import {
  type PlayerData,
  DEFAULT_PLAYER,
  loadPlayerData,
  savePlayerData,
  resetPlayerData as resetStorage,
  getTotalStars,
  type LevelProgress,
} from '@/utils/storage';
import {
  BADGES,
  LEVELS,
  WORLDS,
  getLevelsForWorld,
} from '@/constants/gameData';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface GameContextValue {
  player: PlayerData;
  totalStars: number;
  isLoading: boolean;

  /** Record a level result. Returns the number of stars awarded. */
  completeLevel: (
    levelId: string,
    score: number,
    maxScore: number,
    correctAnswers?: number,
  ) => number;

  /** Check whether a specific level is unlocked */
  isLevelUnlocked: (levelId: string) => boolean;

  /** Check whether a world is unlocked */
  isWorldUnlocked: (worldId: string) => boolean;

  /** Wipe all progress */
  resetProgress: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerData>(DEFAULT_PLAYER);
  const [isLoading, setIsLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    loadPlayerData().then((data) => {
      setPlayer(data);
      setIsLoading(false);
    });
  }, []);

  // Persist whenever player changes (debounced effect)
  useEffect(() => {
    if (!isLoading) {
      savePlayerData(player);
    }
  }, [player, isLoading]);

  // Calculate total stars
  const totalStars = getTotalStars(player.levelProgress);

  // ------ completeLevel ------
  const completeLevel = useCallback(
    (
      levelId: string,
      score: number,
      maxScore: number,
      correctAnswers = 0,
    ): number => {
      const pct = maxScore > 0 ? score / maxScore : 0;
      const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;
      const greenPoints = stars * 5;

      setPlayer((prev) => {
        const prevLevel = prev.levelProgress[levelId];
        const newLevel: LevelProgress = {
          stars: Math.max(stars, prevLevel?.stars ?? 0),
          completed: true,
          highScore: Math.max(score, prevLevel?.highScore ?? 0),
        };

        const newProgress = {
          ...prev.levelProgress,
          [levelId]: newLevel,
        };

        const newGreenScore = prev.greenScore + greenPoints;
        const newCorrectAnswers = prev.totalCorrectAnswers + correctAnswers;

        // --- Badge evaluation ---
        const newBadges = [...prev.badges];
        const addBadge = (id: string) => {
          if (!newBadges.includes(id)) newBadges.push(id);
        };

        // First star
        if (stars > 0) addBadge('first-star');
        // Perfect score
        if (stars === 3) addBadge('perfect-score');
        // Quiz master (20 correct)
        if (newCorrectAnswers >= 20) addBadge('quiz-master');
        // Green score 100
        if (newGreenScore >= 100) addBadge('green-score-100');

        // World completion badges
        const worldBadgeMap: Record<string, string> = {
          w1: 'insulation-pro',
          w2: 'green-builder',
          w3: 'eco-warrior',
          w4: 'community-hero',
        };
        for (const world of WORLDS) {
          const wLevels = getLevelsForWorld(world.id);
          const allDone = wLevels.every(
            (l) => newProgress[l.id]?.completed,
          );
          if (allDone && worldBadgeMap[world.id]) {
            addBadge(worldBadgeMap[world.id]);
          }
        }

        // EcoHero (all levels)
        const allLevelsDone = LEVELS.every(
          (l) => newProgress[l.id]?.completed,
        );
        if (allLevelsDone) addBadge('eco-hero');

        return {
          ...prev,
          greenScore: newGreenScore,
          totalCorrectAnswers: newCorrectAnswers,
          levelProgress: newProgress,
          badges: newBadges,
        };
      });

      return stars;
    },
    [],
  );

  // ------ isLevelUnlocked ------
  const isLevelUnlocked = useCallback(
    (levelId: string): boolean => {
      const level = LEVELS.find((l) => l.id === levelId);
      if (!level) return false;

      // The world must be unlocked first
      const world = WORLDS.find((w) => w.id === level.worldId);
      if (world && totalStars < world.starsToUnlock) return false;

      // Check per-level star requirement (within the world)
      const worldLevels = getLevelsForWorld(level.worldId);
      const worldStars = worldLevels.reduce(
        (sum, l) => sum + (player.levelProgress[l.id]?.stars ?? 0),
        0,
      );
      return worldStars >= level.starsRequired;
    },
    [player.levelProgress, totalStars],
  );

  // ------ isWorldUnlocked ------
  const isWorldUnlocked = useCallback(
    (worldId: string): boolean => {
      const world = WORLDS.find((w) => w.id === worldId);
      if (!world) return false;
      return totalStars >= world.starsToUnlock;
    },
    [totalStars],
  );

  // ------ resetProgress ------
  const resetProgress = useCallback(async () => {
    await resetStorage();
    setPlayer({ ...DEFAULT_PLAYER });
  }, []);

  return (
    <GameContext.Provider
      value={{
        player,
        totalStars,
        isLoading,
        completeLevel,
        isLevelUnlocked,
        isWorldUnlocked,
        resetProgress,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>');
  }
  return ctx;
}
