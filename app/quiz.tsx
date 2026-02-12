/**
 * EcoHero: Flood Fighters — Quiz Mini-Game
 *
 * Multiple-choice questions with animated feedback. Players answer
 * 4 questions per level. Correct answers earn points, and an
 * explanation is shown after each answer.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GameHeader from '@/components/game/GameHeader';
import GameButton from '@/components/game/GameButton';
import ProgressBar from '@/components/game/ProgressBar';
import { useGame } from '@/context/GameContext';
import {
  QUIZ_QUESTIONS,
  getLevelById,
  getWorldById,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function QuizScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();

  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const questions = QUIZ_QUESTIONS[levelId ?? ''] ?? [];

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  // Animations
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const question = questions[currentQ];

  const handleAnswer = useCallback(
    (index: number) => {
      if (answerState !== 'unanswered') return;

      setSelectedIndex(index);
      const isCorrect = index === question.correctIndex;

      if (isCorrect) {
        setScore((s) => s + 1);
        setCorrectCount((c) => c + 1);
        setAnswerState('correct');
      } else {
        setAnswerState('incorrect');
      }

      // Show feedback
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [answerState, question],
  );

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      // Animate card transition
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      feedbackOpacity.setValue(0);
      setCurrentQ((q) => q + 1);
      setAnswerState('unanswered');
      setSelectedIndex(null);
    } else {
      // Finished — record result
      const stars = completeLevel(
        levelId ?? '',
        score + (answerState === 'correct' ? 0 : 0), // score already updated
        questions.length,
        correctCount,
      );
      setFinished(true);

      // Navigate to level complete
      router.replace({
        pathname: '/level-complete',
        params: {
          levelId: levelId ?? '',
          stars: String(stars),
          score: String(score),
          maxScore: String(questions.length),
        },
      });
    }
  }, [currentQ, questions.length, score, correctCount, answerState]);

  if (!level || !question) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <GameButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const progress = (currentQ + 1) / questions.length;

  const getOptionStyle = (index: number) => {
    if (answerState === 'unanswered') return styles.option;
    if (index === question.correctIndex) return [styles.option, styles.optionCorrect];
    if (index === selectedIndex && answerState === 'incorrect')
      return [styles.option, styles.optionIncorrect];
    return [styles.option, styles.optionDimmed];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[world?.color ?? GameColors.water, '#E8F5E9']}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />

      <GameHeader
        title={level.title}
        subtitle={`Question ${currentQ + 1} of ${questions.length}`}
        score={score}
        maxScore={questions.length}
        color={world?.color}
      />

      <ProgressBar
        progress={progress}
        color={GameColors.sun}
        height={8}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Question card */}
        <Animated.View
          style={[styles.questionCard, Shadow.lg, { transform: [{ scale: cardScale }] }]}
        >
          <Text style={styles.questionNumber}>
            Q{currentQ + 1}
          </Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() => handleAnswer(i)}
              disabled={answerState !== 'unanswered'}
              style={getOptionStyle(i)}
            >
              <View style={styles.optionBullet}>
                <Text style={styles.bulletText}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {answerState !== 'unanswered' &&
                i === question.correctIndex && (
                  <Text style={styles.checkMark}>{'\u2705'}</Text>
                )}
              {answerState !== 'unanswered' &&
                i === selectedIndex &&
                i !== question.correctIndex && (
                  <Text style={styles.checkMark}>{'\u274C'}</Text>
                )}
            </Pressable>
          ))}
        </View>

        {/* Feedback */}
        <Animated.View
          style={[styles.feedbackBox, { opacity: feedbackOpacity }]}
        >
          {answerState !== 'unanswered' && (
            <>
              <Text
                style={[
                  styles.feedbackTitle,
                  {
                    color:
                      answerState === 'correct'
                        ? GameColors.correct
                        : GameColors.incorrect,
                  },
                ]}
              >
                {answerState === 'correct'
                  ? '\u{1F389} Correct!'
                  : '\u{1F914} Not quite!'}
              </Text>
              <Text style={styles.feedbackExplanation}>
                {question.explanation}
              </Text>
              <GameButton
                title={
                  currentQ < questions.length - 1
                    ? 'Next Question'
                    : 'See Results'
                }
                onPress={handleNext}
                color={
                  answerState === 'correct'
                    ? GameColors.correct
                    : GameColors.water
                }
                size="md"
              />
            </>
          )}
        </Animated.View>
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

  // Question card
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  questionNumber: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: GameColors.water,
    backgroundColor: GameColors.waterLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: GameColors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Options
  options: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.border,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  optionCorrect: {
    borderColor: GameColors.correct,
    backgroundColor: GameColors.correct + '15',
  },
  optionIncorrect: {
    borderColor: GameColors.incorrect,
    backgroundColor: GameColors.incorrect + '15',
  },
  optionDimmed: {
    opacity: 0.5,
  },
  optionBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GameColors.water + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: GameColors.water,
  },
  optionText: {
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    color: GameColors.textPrimary,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 20,
  },

  // Feedback
  feedbackBox: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.md,
  },
  feedbackTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  feedbackExplanation: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    color: GameColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
