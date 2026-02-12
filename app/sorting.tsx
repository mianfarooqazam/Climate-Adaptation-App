/**
 * EcoHero: Flood Fighters — Sorting / Recycling Mini-Game
 *
 * Items appear one at a time. The player taps one of three bins
 * (Recycle, Compost, Landfill) to sort each item. Points for
 * correct answers; the clock is ticking!
 *
 * Gameplay:
 * - Items shown one at a time with emoji and name
 * - Three bins at the bottom (tap to sort)
 * - Timer counts down (more time on easier difficulties)
 * - Score based on correct sorts vs total items
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
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
  SORTING_ITEMS,
  type SortingItem,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

const BIN_COLORS: Record<string, string> = {
  recycle: '#1E88E5',
  compost: '#43A047',
  landfill: '#78909C',
};

const BIN_EMOJI: Record<string, string> = {
  recycle: '\u{267B}',  // ♻
  compost: '\u{1F33F}', // 🌿
  landfill: '\u{1F5D1}', // 🗑
};

const BIN_LABELS: Record<string, string> = {
  recycle: 'Recycle',
  compost: 'Compost',
  landfill: 'Landfill',
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SortingScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();

  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const difficulty = level?.difficulty ?? 1;

  const itemCount = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 16;
  const timeLimit = difficulty === 1 ? 60 : difficulty === 2 ? 45 : 35;

  const [items] = useState<SortingItem[]>(() =>
    shuffleArray(SORTING_ITEMS).slice(0, itemCount),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [finished, setFinished] = useState(false);

  // Animations
  const itemScale = useRef(new Animated.Value(1)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, finished]);

  const currentItem = items[currentIndex];

  const animateNext = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(itemScale, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(itemOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(itemScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(itemOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const showFeedback = useCallback((type: 'correct' | 'incorrect') => {
    setFeedback(type);
    feedbackScale.setValue(0);
    Animated.sequence([
      Animated.spring(feedbackScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 12,
      }),
      Animated.delay(400),
      Animated.timing(feedbackScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setFeedback(null));
  }, []);

  const finishGame = useCallback(() => {
    setFinished(true);
    const stars = completeLevel(levelId ?? '', score, itemCount, score);

    setTimeout(() => {
      router.replace({
        pathname: '/level-complete',
        params: {
          levelId: levelId ?? '',
          stars: String(stars),
          score: String(score),
          maxScore: String(itemCount),
        },
      });
    }, 800);
  }, [score, itemCount, levelId]);

  const handleBinPress = useCallback(
    (bin: 'recycle' | 'compost' | 'landfill') => {
      if (finished || !currentItem) return;

      const isCorrect = currentItem.correctBin === bin;

      if (isCorrect) {
        setScore((s) => s + 1);
        showFeedback('correct');
      } else {
        showFeedback('incorrect');
      }

      if (currentIndex < items.length - 1) {
        animateNext();
        setCurrentIndex((i) => i + 1);
      } else {
        // Last item
        const finalScore = isCorrect ? score + 1 : score;
        setScore(finalScore);
        setTimeout(() => {
          setFinished(true);
          const stars = completeLevel(
            levelId ?? '',
            finalScore,
            itemCount,
            finalScore,
          );
          router.replace({
            pathname: '/level-complete',
            params: {
              levelId: levelId ?? '',
              stars: String(stars),
              score: String(finalScore),
              maxScore: String(itemCount),
            },
          });
        }, 800);
      }
    },
    [currentIndex, items, currentItem, score, finished, levelId, itemCount],
  );

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
        colors={[world?.color ?? GameColors.sun, '#FFF8E1', '#E8F5E9']}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      <GameHeader
        title={level.title}
        subtitle={`Item ${Math.min(currentIndex + 1, items.length)} of ${items.length}`}
        score={score}
        maxScore={itemCount}
        color={world?.color ?? GameColors.sun}
      />

      {/* Timer & progress */}
      <View style={styles.timerRow}>
        <Text
          style={[
            styles.timer,
            timeLeft <= 10 && { color: GameColors.danger },
          ]}
        >
          {'\u23F1'} {timeLeft}s
        </Text>
        <View style={styles.progressWrapper}>
          <ProgressBar
            progress={(currentIndex + 1) / items.length}
            color={GameColors.sun}
            height={10}
          />
        </View>
      </View>

      {/* Current item */}
      <View style={styles.itemArea}>
        {currentItem && !finished ? (
          <Animated.View
            style={[
              styles.itemCard,
              Shadow.lg,
              {
                transform: [{ scale: itemScale }],
                opacity: itemOpacity,
              },
            ]}
          >
            <Text style={styles.itemEmoji}>{currentItem.emoji}</Text>
            <Text style={styles.itemName}>{currentItem.name}</Text>
            <Text style={styles.itemHint}>
              Which bin does this go in?
            </Text>
          </Animated.View>
        ) : (
          <View style={[styles.itemCard, Shadow.lg]}>
            <Text style={styles.itemEmoji}>{'\u{1F389}'}</Text>
            <Text style={styles.itemName}>All done!</Text>
          </View>
        )}

        {/* Feedback overlay */}
        {feedback && (
          <Animated.View
            style={[
              styles.feedbackBubble,
              { transform: [{ scale: feedbackScale }] },
            ]}
          >
            <Text style={styles.feedbackText}>
              {feedback === 'correct' ? '\u2705' : '\u274C'}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bins */}
      <View style={styles.binsRow}>
        {(['recycle', 'compost', 'landfill'] as const).map((bin) => (
          <Pressable
            key={bin}
            onPress={() => handleBinPress(bin)}
            disabled={finished}
            style={[
              styles.bin,
              { backgroundColor: BIN_COLORS[bin] },
              Shadow.md,
              finished && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.binEmoji}>{BIN_EMOJI[bin]}</Text>
            <Text style={styles.binLabel}>{BIN_LABELS[bin]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Timer
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  timer: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: GameColors.textPrimary,
    width: 70,
  },
  progressWrapper: {
    flex: 1,
  },

  // Item
  itemArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: 220,
    gap: Spacing.sm,
  },
  itemEmoji: {
    fontSize: 72,
  },
  itemName: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: GameColors.textPrimary,
    textAlign: 'center',
  },
  itemHint: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textMuted,
    fontWeight: '600',
  },

  // Feedback
  feedbackBubble: {
    position: 'absolute',
    top: '30%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  feedbackText: {
    fontSize: 40,
  },

  // Bins
  binsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: 50,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  bin: {
    flex: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  binEmoji: {
    fontSize: 36,
  },
  binLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
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
