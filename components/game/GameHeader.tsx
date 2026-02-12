/**
 * Top bar shown during gameplay — shows level title, score, and a back button.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GameColors, Spacing, FontSizes, Fonts, Shadow } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  score?: number;
  maxScore?: number;
  color?: string;
}

export default function GameHeader({
  title,
  subtitle,
  score,
  maxScore,
  color = GameColors.primary,
}: Props) {
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: color }, Shadow.md]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>{'\u2190'}</Text>
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {score !== undefined && maxScore !== undefined ? (
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            {score}/{maxScore}
          </Text>
        </View>
      ) : (
        <View style={styles.backBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  scoreBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '700',
  },
});
