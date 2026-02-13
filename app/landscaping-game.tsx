/**
 * EcoHero: Flood Fighters — Strategic Landscaping Game
 *
 * Level 1: Two roads — one with trees (shade, people comfortable),
 *          one without (bright sun, people sweating).
 * Level 2: Two homes — one without trees (hot), one where user drags
 *          a tree near the home to block sun rays. No thermometer.
 * Trees are drawn bigger.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GameButton from '@/components/game/GameButton';
import LanguageToggle from '@/components/game/LanguageToggle';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLevelById } from '@/constants/gameData';
import { Fonts, FontSizes, GameColors, Radius, Spacing } from '@/constants/theme';

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const TRAY_H = 72;
const SCENE_H = SCR_H - HEADER_H - TRAY_H;

// Big tree size (user asked for bigger trees)
const TREE_SIZE = 72;
const TREE_EMOJI = '\u{1F333}'; // 🌳
const SUN_EMOJI = '\u2600\uFE0F'; // ☀️

export default function LandscapingGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();
  const { t, lang } = useLanguage();

  const level = getLevelById(levelId ?? 'w6-l1');
  const isLevel1 = levelId === 'w6-l1';
  const isLevel2 = levelId === 'w6-l2';

  const [treePlaced, setTreePlaced] = useState(false);
  const dragTree = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleTree = useRef(new Animated.Value(1)).current;
  const [isDraggingTree, setIsDraggingTree] = useState(false);

  // Level 2: drop zone near right home (center-right of screen)
  const HOME2_LEFT = SCR_W * 0.52;
  const HOME2_TOP = SCENE_H * 0.35;
  const HOME2_W = 100;
  const HOME2_H = 80;
  const DROP_MARGIN = 60;
  const DROP_LEFT = HOME2_LEFT - DROP_MARGIN;
  const DROP_TOP = HOME2_TOP - 20;
  const DROP_W = HOME2_W + DROP_MARGIN * 2;
  const DROP_H = HOME2_H + 80;
  const TRAY_TREE_START_Y = SCR_H - TRAY_H + 16;

  const tryDropTree = useCallback((moveX: number, moveY: number) => {
    if (
      moveX >= DROP_LEFT &&
      moveX <= DROP_LEFT + DROP_W &&
      moveY >= DROP_TOP &&
      moveY <= DROP_TOP + DROP_H
    ) {
      setTreePlaced(true);
    }
  }, []);

  const treePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderGrant: () => {
        setIsDraggingTree(true);
        dragTree.setOffset({ x: (dragTree.x as any)._value ?? 0, y: (dragTree.y as any)._value ?? 0 });
        dragTree.setValue({ x: 0, y: 0 });
        Animated.spring(scaleTree, { toValue: 1.15, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => dragTree.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        setIsDraggingTree(false);
        dragTree.flattenOffset();
        Animated.spring(scaleTree, { toValue: 1, useNativeDriver: true }).start();
        tryDropTree(g.moveX, g.moveY);
        Animated.spring(dragTree, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const finishLevel = (stars = 3, score = 30, max = 30) => {
    completeLevel(level?.id ?? 'w6-l1', score, max);
    router.replace({
      pathname: '/level-complete',
      params: { levelId: level?.id ?? 'w6-l1', stars: String(stars), score: String(score), maxScore: String(max) },
    });
  };

  // Level 1: Continue button
  const onContinueL1 = () => finishLevel(3, 30, 30);

  // Level 2: Success when tree placed
  useEffect(() => {
    if (isLevel2 && treePlaced) {
      const t = setTimeout(() => finishLevel(3, 30, 30), 1500);
      return () => clearTimeout(t);
    }
  }, [isLevel2, treePlaced]);

  if (!level) return null;

  // ========== LEVEL 1: Two roads ==========
  if (isLevel1) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />
        <View style={[styles.header, { height: HEADER_H }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>{'\u2190'}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]} numberOfLines={1}>
            {t('landscapingLevel1')}
          </Text>
          <View style={{ flex: 1 }} />
          <LanguageToggle />
        </View>

        <View style={styles.scene}>
          {/* Left road: with trees, shade, people comfortable */}
          <View style={[styles.roadColumn, { borderRightWidth: 2, borderColor: 'rgba(0,0,0,0.1)' }]}>
            <Text style={styles.sunIcon}>{SUN_EMOJI}</Text>
            <View style={[styles.roadStrip, { backgroundColor: '#78909C' }]} />
            <View style={styles.treeRow}>
              <Text style={styles.bigTree}>{TREE_EMOJI}</Text>
              <Text style={styles.bigTree}>{TREE_EMOJI}</Text>
              <Text style={styles.bigTree}>{TREE_EMOJI}</Text>
            </View>
            <View style={[styles.shadeOverlay, { opacity: 0.4 }]} />
            <Text style={styles.roadLabel}>{t('roadWithTrees')}</Text>
            <View style={styles.peopleRow}>
              <Text style={styles.personEmoji}>{'\u{1F603}'}</Text>
              <Text style={styles.personEmoji}>{'\u{1F603}'}</Text>
              <Text style={styles.personEmoji}>{'\u{1F603}'}</Text>
            </View>
            <Text style={styles.moodTextCool}>{t('comfortable')}</Text>
          </View>

          {/* Right road: no trees, bright sun, people sweating */}
          <View style={styles.roadColumn}>
            <Text style={styles.sunIcon}>{SUN_EMOJI}</Text>
            <View style={[styles.roadStrip, { backgroundColor: '#90A4AE' }]} />
            <View style={styles.roadLabelPlaceholder} />
            <Text style={styles.roadLabel}>{t('roadNoTrees')}</Text>
            <View style={styles.peopleRow}>
              <Text style={styles.personEmoji}>{'\u{1F975}'}</Text>
              <Text style={styles.personEmoji}>{'\u{1F975}'}</Text>
              <Text style={styles.personEmoji}>{'\u{1F975}'}</Text>
            </View>
            <Text style={styles.moodTextHot}>{t('sweating')}</Text>
          </View>
        </View>

        <Pressable style={styles.continueWrap} onPress={onContinueL1}>
          <Text style={[styles.continueText, lang === 'ur' && styles.rtl]}>{t('continueBtn')}</Text>
          <Text style={styles.continueArrow}>{'\u27A1'}</Text>
        </Pressable>
      </View>
    );
  }

  // ========== LEVEL 2: Two homes, drag tree to shade right home ==========
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { height: HEADER_H }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]} numberOfLines={1}>
          {t('landscapingLevel2')}
        </Text>
        <View style={{ flex: 1 }} />
        <LanguageToggle />
      </View>

      <View style={[styles.scene, { height: SCENE_H }]}>
        {/* Home 1: no trees, hot */}
        <View style={[styles.homeBox, { left: SCR_W * 0.12, top: SCENE_H * 0.35 }]}>
          <Text style={styles.sunSmall}>{SUN_EMOJI}</Text>
          <View style={[styles.homeShape, { backgroundColor: '#8D6E63' }]}>
            <View style={styles.roofShape} />
            <View style={styles.doorShape} />
          </View>
          <Text style={styles.hotLabel}>{t('hot')}</Text>
        </View>

        {/* Home 2: drop zone for tree; when placed, show tree + shade */}
        <View style={[styles.homeBox, { left: HOME2_LEFT, top: HOME2_TOP }]}>
          <Text style={styles.sunSmall}>{SUN_EMOJI}</Text>
          {treePlaced && (
            <View style={styles.placedTreeWrap}>
              <Text style={styles.placedTree}>{TREE_EMOJI}</Text>
            </View>
          )}
          <View style={[styles.homeShape, { backgroundColor: '#8D6E63' }]}>
            <View style={styles.roofShape} />
            <View style={styles.doorShape} />
          </View>
          {treePlaced ? (
            <Text style={styles.coolLabel}>{t('comfortable')}</Text>
          ) : (
            <Text style={styles.dragHint}>{t('dragTreeToShade')}</Text>
          )}
        </View>
      </View>

      {/* Tray: draggable tree (only when not yet placed) */}
      {!treePlaced && (
        <View style={styles.tray}>
          <Text style={styles.trayLabel}>{t('dragTreeToShade')}</Text>
          <Animated.View
            {...treePanResponder.panHandlers}
            style={[
              styles.dragTreeWrap,
              {
                transform: [...dragTree.getTranslateTransform(), { scale: scaleTree }],
                zIndex: isDraggingTree ? 100 : 10,
              },
            ]}
          >
            <Text style={styles.dragTreeEmoji}>{TREE_EMOJI}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rtl: { writingDirection: 'rtl' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0,77,64,0.9)',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backTxt: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },

  scene: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },

  // Level 1: roads
  roadColumn: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 8,
    position: 'relative',
  },
  sunIcon: { fontSize: 44, marginBottom: 8 },
  roadStrip: {
    width: '90%',
    height: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  treeRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  bigTree: { fontSize: TREE_SIZE },
  shadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 80,
    bottom: 100,
    backgroundColor: '#2E7D32',
    pointerEvents: 'none',
  },
  roadLabelPlaceholder: { height: 24 },
  roadLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: GameColors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  peopleRow: { flexDirection: 'row', gap: 12 },
  personEmoji: { fontSize: 36 },
  moodTextCool: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 4,
  },
  moodTextHot: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#C62828',
    marginTop: 4,
  },

  continueWrap: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#A5D6A7',
    borderRadius: 12,
    gap: 8,
  },
  continueText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#fff',
  },
  continueArrow: { fontSize: 20, color: '#fff', fontWeight: '700' },

  // Level 2: homes
  homeBox: {
    position: 'absolute',
    width: 120,
    alignItems: 'center',
  },
  sunSmall: { fontSize: 32, marginBottom: 4 },
  homeShape: {
    width: 100,
    height: 70,
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    alignItems: 'center',
    paddingTop: 8,
  },
  roofShape: {
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#5D4037',
    borderStyle: 'solid',
    marginTop: -20,
  },
  doorShape: {
    width: 24,
    height: 36,
    backgroundColor: '#5D4037',
    borderRadius: 4,
    marginTop: 8,
  },
  hotLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#C62828',
    marginTop: 4,
  },
  coolLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 4,
  },
  dragHint: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: GameColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  placedTreeWrap: { position: 'absolute', top: 28, zIndex: 5 },
  placedTree: { fontSize: 64 },

  tray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TRAY_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: 'rgba(46,125,50,0.9)',
  },
  trayLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
  },
  dragTreeWrap: { alignItems: 'center', justifyContent: 'center' },
  dragTreeEmoji: { fontSize: 58 },
});
