/**
 * EcoHero: Flood Fighters — Flood Defense Mini-Game
 *
 * Players tap grid cells to place defense items (sandbags, barriers, drains)
 * to protect buildings from rising water. The water level rises over time
 * and the player must strategically place defenses.
 *
 * Gameplay:
 * - 5x4 grid representing the area around a building
 * - Water rises from the bottom row
 * - Player selects a defense item from toolbar, then taps cells to place
 * - Each item blocks a certain amount of water
 * - After placement phase, water animation plays
 * - Score based on how much of the building is protected
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GameHeader from '@/components/game/GameHeader';
import GameButton from '@/components/game/GameButton';
import { useGame } from '@/context/GameContext';
import {
  getLevelById,
  getWorldById,
  FLOOD_DEFENSE_ITEMS,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_COLS = 5;
const GRID_ROWS = 5;
const CELL_SIZE = Math.floor((SCREEN_W - Spacing.lg * 2 - Spacing.sm * (GRID_COLS - 1)) / GRID_COLS);

type CellType = 'empty' | 'building' | 'defense' | 'water';

interface Cell {
  type: CellType;
  defenseId?: string;
  defenseEmoji?: string;
}

function createGrid(difficulty: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ type: 'empty' as CellType })),
  );

  // Place buildings in the center area
  grid[1][2] = { type: 'building' };
  grid[1][3] = { type: 'building' };
  grid[2][2] = { type: 'building' };
  grid[2][3] = { type: 'building' };

  if (difficulty >= 2) {
    grid[1][1] = { type: 'building' };
    grid[2][1] = { type: 'building' };
  }

  return grid;
}

function getMaxPlacements(difficulty: number): number {
  return difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10;
}

export default function FloodDefenseScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();

  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const difficulty = level?.difficulty ?? 1;

  const [grid, setGrid] = useState<Cell[][]>(() => createGrid(difficulty));
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState(0);
  const maxPlacements = getMaxPlacements(difficulty);
  const [phase, setPhase] = useState<'place' | 'flood' | 'result'>('place');
  const [protectionScore, setProtectionScore] = useState(0);

  // Water animation
  const waterLevel = useRef(new Animated.Value(0)).current;

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (phase !== 'place') return;
      if (!selectedItem) return;
      if (grid[row][col].type !== 'empty') return;
      if (placements >= maxPlacements) return;

      const item = FLOOD_DEFENSE_ITEMS.find((i) => i.id === selectedItem);
      if (!item) return;

      setGrid((prev) => {
        const newGrid = prev.map((r) => r.map((c) => ({ ...c })));
        newGrid[row][col] = {
          type: 'defense',
          defenseId: item.id,
          defenseEmoji: item.emoji,
        };
        return newGrid;
      });
      setPlacements((p) => p + 1);
    },
    [phase, selectedItem, grid, placements, maxPlacements],
  );

  const simulateFlood = useCallback(() => {
    setPhase('flood');

    // Animate water rising
    Animated.timing(waterLevel, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      // Calculate protection score
      let totalDefense = 0;
      let buildingCount = 0;
      let protectedBuildings = 0;

      grid.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell.type === 'defense') {
            const item = FLOOD_DEFENSE_ITEMS.find(
              (i) => i.id === cell.defenseId,
            );
            totalDefense += item?.effectiveness ?? 0;
          }
          if (cell.type === 'building') {
            buildingCount++;
            // Check if building has adjacent defenses
            const neighbors = [
              [ri - 1, ci],
              [ri + 1, ci],
              [ri, ci - 1],
              [ri, ci + 1],
            ];
            const hasDefense = neighbors.some(([nr, nc]) => {
              if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS)
                return false;
              return grid[nr][nc].type === 'defense';
            });
            if (hasDefense) protectedBuildings++;
          }
        });
      });

      // Score: combination of defense strength and building protection
      const defenseBonus = Math.min(totalDefense * 2, 40);
      const protectionPct =
        buildingCount > 0 ? protectedBuildings / buildingCount : 0;
      const finalScore = Math.round(
        protectionPct * 60 + defenseBonus,
      );

      setProtectionScore(Math.min(finalScore, 100));
      setPhase('result');
    });
  }, [grid]);

  const handleFinish = useCallback(() => {
    const stars = completeLevel(levelId ?? '', protectionScore, 100);
    router.replace({
      pathname: '/level-complete',
      params: {
        levelId: levelId ?? '',
        stars: String(stars),
        score: String(protectionScore),
        maxScore: '100',
      },
    });
  }, [protectionScore, levelId]);

  if (!level) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <GameButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const waterHeight = waterLevel.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '60%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E88E5', '#64B5F6', '#E3F2FD']}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      <GameHeader
        title={level.title}
        subtitle={
          phase === 'place'
            ? `Place defenses: ${placements}/${maxPlacements}`
            : phase === 'flood'
              ? 'Water rising...'
              : `Score: ${protectionScore}%`
        }
        color={GameColors.water}
      />

      {/* Grid area */}
      <View style={styles.gridWrapper}>
        {/* Water overlay (animated from bottom) */}
        {phase !== 'place' && (
          <Animated.View
            style={[
              styles.waterOverlay,
              { height: waterHeight },
            ]}
          >
            <LinearGradient
              colors={['rgba(30,136,229,0.3)', 'rgba(30,136,229,0.7)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {/* Grid cells */}
        {grid.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map((cell, ci) => (
              <Pressable
                key={ci}
                onPress={() => handleCellPress(ri, ci)}
                style={[
                  styles.cell,
                  cell.type === 'building' && styles.cellBuilding,
                  cell.type === 'defense' && styles.cellDefense,
                  cell.type === 'empty' &&
                    selectedItem &&
                    phase === 'place' &&
                    styles.cellPlaceable,
                ]}
              >
                <Text style={styles.cellEmoji}>
                  {cell.type === 'building'
                    ? '\u{1F3E0}'
                    : cell.type === 'defense'
                      ? cell.defenseEmoji
                      : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {/* Toolbar or Result */}
      {phase === 'place' && (
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>Select & Place:</Text>
          <View style={styles.toolbarItems}>
            {FLOOD_DEFENSE_ITEMS.slice(0, difficulty + 2).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item.id)}
                style={[
                  styles.toolItem,
                  selectedItem === item.id && styles.toolItemSelected,
                ]}
              >
                <Text style={styles.toolEmoji}>{item.emoji}</Text>
                <Text style={styles.toolName}>{item.name}</Text>
              </Pressable>
            ))}
          </View>

          <GameButton
            title={'\u{1F30A} Release the Flood!'}
            onPress={simulateFlood}
            color={GameColors.water}
            size="md"
            disabled={placements === 0}
          />
        </View>
      )}

      {phase === 'result' && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>
            {protectionScore >= 60
              ? '\u{1F389} Well defended!'
              : '\u{1F30A} The flood broke through!'}
          </Text>
          <Text style={styles.resultScore}>
            Protection: {protectionScore}%
          </Text>
          <GameButton
            title="Continue"
            onPress={handleFinish}
            color={GameColors.primary}
            size="md"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  gridWrapper: {
    alignItems: 'center',
    padding: Spacing.lg,
    position: 'relative',
  },
  waterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cellBuilding: {
    backgroundColor: 'rgba(255,183,77,0.4)',
    borderColor: '#FFB74D',
  },
  cellDefense: {
    backgroundColor: 'rgba(76,175,80,0.35)',
    borderColor: '#4CAF50',
  },
  cellPlaceable: {
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  cellEmoji: {
    fontSize: CELL_SIZE * 0.5,
  },

  // Toolbar
  toolbar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  toolbarTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: GameColors.textPrimary,
  },
  toolbarItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toolItem: {
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 80,
  },
  toolItemSelected: {
    borderColor: GameColors.water,
    backgroundColor: '#BBDEFB',
  },
  toolEmoji: { fontSize: 28 },
  toolName: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: GameColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Result
  resultBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadow.lg,
  },
  resultTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: GameColors.textPrimary,
    textAlign: 'center',
  },
  resultScore: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    color: GameColors.water,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    color: GameColors.textMuted,
  },
});
