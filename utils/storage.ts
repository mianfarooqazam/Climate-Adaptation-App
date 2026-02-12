/**
 * EcoHero: Flood Fighters — Persistent Storage
 *
 * Uses AsyncStorage to save and load player progress.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LevelProgress {
  stars: number;   // 0–3
  completed: boolean;
  highScore: number;
}

export interface PlayerData {
  name: string;
  greenScore: number;
  totalCorrectAnswers: number;
  levelProgress: Record<string, LevelProgress>;
  badges: string[]; // badge IDs
  currentWorldId: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@ecohero_player';

export const DEFAULT_PLAYER: PlayerData = {
  name: 'EcoHero',
  greenScore: 0,
  totalCorrectAnswers: 0,
  levelProgress: {},
  badges: [],
  currentWorldId: 'w1',
};

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function loadPlayerData(): Promise<PlayerData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PLAYER, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load player data', e);
  }
  return { ...DEFAULT_PLAYER };
}

export async function savePlayerData(data: PlayerData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save player data', e);
  }
}

export async function resetPlayerData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to reset player data', e);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getTotalStars(progress: Record<string, LevelProgress>): number {
  return Object.values(progress).reduce((sum, lp) => sum + lp.stars, 0);
}

export function getWorldStars(
  progress: Record<string, LevelProgress>,
  worldId: string,
): number {
  return Object.entries(progress)
    .filter(([key]) => key.startsWith(worldId))
    .reduce((sum, [, lp]) => sum + lp.stars, 0);
}

export function isWorldComplete(
  progress: Record<string, LevelProgress>,
  worldId: string,
  totalLevels: number,
): boolean {
  const completed = Object.entries(progress).filter(
    ([key, lp]) => key.startsWith(worldId) && lp.completed,
  ).length;
  return completed >= totalLevels;
}
