/**
 * EcoHero: Flood Fighters — Eco Builder Mini-Game
 *
 * Players tap to add green features (solar panels, insulation, rain
 * gardens, etc.) to a house. Each feature earns green points and the
 * player tries to maximise their eco-score within a limited number
 * of slots.
 *
 * Gameplay:
 * - A house with labelled "slots" (roof, walls, garden, windows, etc.)
 * - A toolbar of eco items to choose from
 * - Player selects an item, then taps a compatible slot
 * - Green points accumulate; educational descriptions shown
 * - Score based on total green points / maximum possible
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GameHeader from '@/components/game/GameHeader';
import GameButton from '@/components/game/GameButton';
import ProgressBar from '@/components/game/ProgressBar';
import { useGame } from '@/context/GameContext';
import {
  getLevelById,
  getWorldById,
  ECO_BUILDER_ITEMS,
  type EcoBuilderItem,
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

// Building slots
interface BuildSlot {
  id: string;
  label: string;
  category: EcoBuilderItem['category'];
  emoji: string;
  x: number; // percentage from left
  y: number; // percentage from top
}

const BUILDING_SLOTS: BuildSlot[] = [
  { id: 'roof', label: 'Roof', category: 'energy', emoji: '\u{1F3E0}', x: 50, y: 8 },
  { id: 'roof2', label: 'Roof (Green)', category: 'water', emoji: '\u{1F33F}', x: 75, y: 12 },
  { id: 'wall-left', label: 'Left Wall', category: 'insulation', emoji: '\u{1F9F1}', x: 18, y: 40 },
  { id: 'wall-right', label: 'Right Wall', category: 'insulation', emoji: '\u{1F9F1}', x: 82, y: 40 },
  { id: 'window', label: 'Window', category: 'insulation', emoji: '\u{1FA9F}', x: 38, y: 38 },
  { id: 'window2', label: 'Window', category: 'insulation', emoji: '\u{1FA9F}', x: 62, y: 38 },
  { id: 'garden-left', label: 'Garden', category: 'nature', emoji: '\u{1F333}', x: 15, y: 80 },
  { id: 'garden-right', label: 'Garden', category: 'water', emoji: '\u{1F33A}', x: 85, y: 80 },
];

export default function EcoBuilderScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();

  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const difficulty = level?.difficulty ?? 1;

  // Available items based on difficulty
  const availableItems = ECO_BUILDER_ITEMS.slice(
    0,
    difficulty === 1 ? 4 : difficulty === 2 ? 6 : ECO_BUILDER_ITEMS.length,
  );

  const maxSlots = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
  const maxPossiblePoints = BUILDING_SLOTS.slice(0, maxSlots).reduce(
    (sum, slot) => {
      // Find best item for each slot
      const best = availableItems
        .filter((i) => i.category === slot.category)
        .reduce((max, i) => Math.max(max, i.greenPoints), 0);
      return sum + best;
    },
    0,
  );

  const [selectedItem, setSelectedItem] = useState<EcoBuilderItem | null>(null);
  const [placedItems, setPlacedItems] = useState<Record<string, EcoBuilderItem>>({});
  const [lastPlaced, setLastPlaced] = useState<EcoBuilderItem | null>(null);

  const greenPoints = Object.values(placedItems).reduce(
    (sum, item) => sum + item.greenPoints,
    0,
  );
  const slotsUsed = Object.keys(placedItems).length;

  const handleSlotPress = useCallback(
    (slot: BuildSlot) => {
      if (!selectedItem) return;
      if (slotsUsed >= maxSlots && !placedItems[slot.id]) return;

      // Check category compatibility
      if (selectedItem.category !== slot.category) return;

      setPlacedItems((prev) => ({
        ...prev,
        [slot.id]: selectedItem,
      }));
      setLastPlaced(selectedItem);
    },
    [selectedItem, slotsUsed, maxSlots, placedItems],
  );

  const handleFinish = useCallback(() => {
    const score = greenPoints;
    const maxScore = Math.max(maxPossiblePoints, 1);
    const stars = completeLevel(levelId ?? '', score, maxScore);

    router.replace({
      pathname: '/level-complete',
      params: {
        levelId: levelId ?? '',
        stars: String(stars),
        score: String(score),
        maxScore: String(maxScore),
      },
    });
  }, [greenPoints, maxPossiblePoints, levelId]);

  if (!level) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <GameButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[world?.color ?? GameColors.primary, '#E8F5E9']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFill}
      />

      <GameHeader
        title={level.title}
        subtitle={`Slots: ${slotsUsed}/${maxSlots}`}
        score={greenPoints}
        maxScore={maxPossiblePoints}
        color={world?.color}
      />

      <ProgressBar
        progress={greenPoints / Math.max(maxPossiblePoints, 1)}
        color={GameColors.primaryLight}
        height={8}
        label={`Green Points: ${greenPoints}`}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* House area */}
        <View style={styles.houseArea}>
          {/* House base shape */}
          <View style={styles.houseBody}>
            {/* Roof */}
            <View style={styles.roof}>
              <Text style={styles.roofEmoji}>{'\u{1F3E0}'}</Text>
            </View>
            {/* Walls */}
            <View style={styles.walls}>
              <View style={styles.door}>
                <Text style={styles.doorEmoji}>{'\u{1F6AA}'}</Text>
              </View>
            </View>
          </View>

          {/* Slot buttons overlaid */}
          {BUILDING_SLOTS.slice(0, maxSlots).map((slot) => {
            const placed = placedItems[slot.id];
            const isCompatible =
              selectedItem && selectedItem.category === slot.category;

            return (
              <Pressable
                key={slot.id}
                onPress={() => handleSlotPress(slot)}
                style={[
                  styles.slot,
                  {
                    left: `${slot.x - 8}%`,
                    top: `${slot.y - 5}%`,
                  },
                  placed && styles.slotFilled,
                  isCompatible && !placed && styles.slotHighlight,
                ]}
              >
                <Text style={styles.slotEmoji}>
                  {placed ? placed.emoji : slot.emoji}
                </Text>
                <Text style={styles.slotLabel}>
                  {placed ? placed.name : slot.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Info about last placed item */}
        {lastPlaced && (
          <View style={styles.infoBox}>
            <Text style={styles.infoEmoji}>{lastPlaced.emoji}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{lastPlaced.name}</Text>
              <Text style={styles.infoDesc}>
                {lastPlaced.description}
              </Text>
              <Text style={styles.infoPoints}>
                +{lastPlaced.greenPoints} green points
              </Text>
            </View>
          </View>
        )}

        {/* Item toolbar */}
        <Text style={styles.toolbarTitle}>
          {'\u{1F528}'} Select an item to place:
        </Text>
        <View style={styles.itemGrid}>
          {availableItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedItem(item)}
              style={[
                styles.itemCard,
                selectedItem?.id === item.id && styles.itemCardSelected,
              ]}
            >
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPoints}>
                +{item.greenPoints} pts
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Finish button */}
        <View style={styles.finishArea}>
          <GameButton
            title={'\u2705 Done Building!'}
            onPress={handleFinish}
            color={GameColors.primary}
            size="lg"
            disabled={slotsUsed === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.lg,
    paddingBottom: 60,
  },

  // House
  houseArea: {
    width: '100%',
    height: 300,
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  houseBody: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '10%',
    bottom: '15%',
    alignItems: 'center',
  },
  roof: {
    width: '120%',
    height: 60,
    backgroundColor: '#8D6E63',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roofEmoji: { fontSize: 30 },
  walls: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFCC80',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  door: {
    width: 40,
    height: 55,
    backgroundColor: '#6D4C41',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doorEmoji: { fontSize: 20 },

  // Slots
  slot: {
    position: 'absolute',
    width: 70,
    height: 55,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  slotFilled: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderColor: GameColors.primaryLight,
    borderStyle: 'solid',
  },
  slotHighlight: {
    backgroundColor: 'rgba(255,193,7,0.3)',
    borderColor: GameColors.sun,
  },
  slotEmoji: { fontSize: 22 },
  slotLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 9,
    fontWeight: '700',
    color: GameColors.textPrimary,
    textAlign: 'center',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  infoEmoji: { fontSize: 36 },
  infoContent: { flex: 1 },
  infoTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: GameColors.textPrimary,
  },
  infoDesc: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  infoPoints: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: GameColors.primaryLight,
    marginTop: 4,
  },

  // Toolbar
  toolbarTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: GameColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  itemCard: {
    width: (SCREEN_W - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  itemCardSelected: {
    borderColor: GameColors.sun,
    backgroundColor: GameColors.sunLight + '30',
  },
  itemEmoji: { fontSize: 28 },
  itemName: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: GameColors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  itemPoints: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: GameColors.primaryLight,
  },

  // Finish
  finishArea: {
    alignItems: 'center',
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
