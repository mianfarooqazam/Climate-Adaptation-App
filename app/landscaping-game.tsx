/**
 * EcoHero: Flood Fighters — Strategic Landscaping Game
 *
 * Level 1: Two roads — same house as insulation/windows; one side with big trees
 *          (shade, people comfortable), one without (bright sun, people sweating).
 * Level 2: Two same houses — one without trees (hot), one where user drags
 *          a tree near the home to block sun. No thermometer.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GameButton from '@/components/game/GameButton';
import LanguageToggle from '@/components/game/LanguageToggle';
import {
  LandscapingHouse,
  Tree,
  moodCool,
  moodHot,
} from '@/components/game/LandscapingHouse';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLevelById } from '@/constants/gameData';
import { Fonts, FontSizes, GameColors, Spacing } from '@/constants/theme';

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const TRAY_H = 80;
const SCENE_H = SCR_H - HEADER_H - TRAY_H;

// House scale so two fit on screen
const HOUSE_SCALE = 0.48;
const H_W = 180;
const H_H = 124;
const HOUSE_OFFSET_Y = SCENE_H * 0.18;
const HOUSE1_LEFT = SCR_W * 0.06;
const HOUSE2_LEFT = SCR_W * 0.52;

// Level 2 drop zone near right house
const DROP_MARGIN = 50;
const DROP_LEFT = HOUSE2_LEFT - DROP_MARGIN;
const DROP_TOP = HEADER_H + HOUSE_OFFSET_Y - 15;
const DROP_W = H_W * HOUSE_SCALE + DROP_MARGIN * 2;
const DROP_H = H_H * HOUSE_SCALE + 70;

const SUN_EMOJI = '\u2600\uFE0F';

export default function LandscapingGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();
  const { t, lang } = useLanguage();

  const level = getLevelById(levelId ?? 'w6-l1');
  const isLevel1 = levelId === 'w6-l1';
  const isLevel2 = levelId === 'w6-l2';

  const [treePlaced, setTreePlaced] = useState(false);
  const [showDragHintModal, setShowDragHintModal] = useState(false);
  const dragTree = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleTree = useRef(new Animated.Value(1)).current;
  const [isDraggingTree, setIsDraggingTree] = useState(false);

  const tryDropTree = useCallback((moveX: number, moveY: number) => {
    if (moveX >= DROP_LEFT && moveX <= DROP_LEFT + DROP_W && moveY >= DROP_TOP && moveY <= DROP_TOP + DROP_H) {
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

  const onContinueL1 = () => finishLevel(3, 30, 30);

  useEffect(() => {
    if (isLevel2 && treePlaced) {
      const id = setTimeout(() => finishLevel(3, 30, 30), 1500);
      return () => clearTimeout(id);
    }
  }, [isLevel2, treePlaced]);

  if (!level) return null;

  // ========== LEVEL 1: Two roads, same house each side; left with trees ==========
  if (isLevel1) {
    const colW = SCR_W / 2;
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
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          </View>
          {/* Ground */}
          <View style={[styles.ground, { height: SCENE_H * 0.2 }]}>
            <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
          </View>

          {/* Left column: house + trees, comfortable */}
          <View style={[styles.column, { width: colW }]}>
            <Text style={[styles.sunIcon, { left: colW * 0.35 }]}>{SUN_EMOJI}</Text>
            <LandscapingHouse
              left={colW * 0.08}
              top={HOUSE_OFFSET_Y}
              scale={HOUSE_SCALE}
              mood={moodCool}
              moodLabel={t('comfortable')}
            />
            <View style={[styles.treeGroupLeft, { left: colW * 0.02, top: HOUSE_OFFSET_Y + 20 }]}>
              <Tree size={1.1} />
              <Tree size={1} style={{ position: 'absolute', left: 75, top: 10 }} />
              <Tree size={0.95} style={{ position: 'absolute', left: 145, top: 5 }} />
            </View>
            <View style={[styles.shadeOverlay, { width: colW, left: 0, top: 0, bottom: 0, opacity: 0.25 }]} />
          </View>

          {/* Right column: house, no trees, hot */}
          <View style={[styles.column, { width: colW, left: colW }]}>
            <Text style={[styles.sunIcon, { left: colW * 0.35 }]}>{SUN_EMOJI}</Text>
            <LandscapingHouse
              left={colW * 0.08}
              top={HOUSE_OFFSET_Y}
              scale={HOUSE_SCALE}
              mood={moodHot}
              moodLabel={t('sweating')}
            />
          </View>
        </View>

        <Pressable style={styles.continueWrap} onPress={onContinueL1}>
          <Text style={[styles.continueText, lang === 'ur' && styles.rtl]}>{t('continueBtn')}</Text>
          <Text style={styles.continueArrow}>{'\u27A1'}</Text>
        </Pressable>
      </View>
    );
  }

  // ========== LEVEL 2: Two houses, drag tree to shade right ==========
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
        <Pressable onPress={() => setShowDragHintModal(true)} style={styles.infoBtn} hitSlop={8}>
          <Text style={styles.infoIcon}>{'\u2139'}</Text>
        </Pressable>
      </View>

      <View style={[styles.scene, { height: SCENE_H }]}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.ground, { height: SCENE_H * 0.22 }]}>
          <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
        </View>

        {/* Left house: no trees, hot */}
        <Text style={[styles.sunSmall, { left: HOUSE1_LEFT + 40 }]}>{SUN_EMOJI}</Text>
        <LandscapingHouse
          left={HOUSE1_LEFT}
          top={HOUSE_OFFSET_Y}
          scale={HOUSE_SCALE}
          mood={moodHot}
          moodLabel={t('hot')}
        />

        {/* Right house: tree when placed, else hot */}
        <Text style={[styles.sunSmall, { left: HOUSE2_LEFT + 40 }]}>{SUN_EMOJI}</Text>
        {treePlaced && (
          <View style={[styles.placedTreeWrap, { left: HOUSE2_LEFT - 30, top: HOUSE_OFFSET_Y + 25 }]}>
            <Tree size={1.2} />
          </View>
        )}
        <LandscapingHouse
          left={HOUSE2_LEFT}
          top={HOUSE_OFFSET_Y}
          scale={HOUSE_SCALE}
          mood={treePlaced ? moodCool : moodHot}
          moodLabel={treePlaced ? t('comfortable') : t('hot')}
        />
      </View>

      {!treePlaced && (
        <View style={styles.tray}>
          <Text style={[styles.trayLabel, lang === 'ur' && styles.rtl]}>{t('dragTreeToShade')}</Text>
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
            <Tree size={1} />
          </Animated.View>
        </View>
      )}

      <Modal visible={showDragHintModal} transparent animationType="fade" onRequestClose={() => setShowDragHintModal(false)}>
        <Pressable style={styles.dragHintOverlay} onPress={() => setShowDragHintModal(false)}>
          <Pressable style={styles.dragHintCard} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.dragHintText, lang === 'ur' && styles.rtl]}>{t('dragDropHint')}</Text>
            <GameButton title={t('back')} onPress={() => setShowDragHintModal(false)} color={GameColors.primary} textColor="#fff" size="md" />
          </Pressable>
        </Pressable>
      </Modal>
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
  infoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  dragHintOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dragHintCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, alignItems: 'center', gap: 16 },
  dragHintText: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, color: GameColors.textPrimary, textAlign: 'center', lineHeight: 22 },
  scene: { flex: 1, position: 'relative', overflow: 'hidden' },
  column: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 },
  sunIcon: { position: 'absolute', top: 8, fontSize: 40 },
  sunSmall: { position: 'absolute', top: 4, fontSize: 36 },
  treeGroupLeft: { position: 'absolute', width: 220, height: 140, zIndex: 5 },
  shadeOverlay: { position: 'absolute', backgroundColor: '#2E7D32', zIndex: 4, pointerEvents: 'none' },
  placedTreeWrap: { position: 'absolute', zIndex: 6 },
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
  continueText: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, fontWeight: '800', color: '#fff' },
  continueArrow: { fontSize: 20, color: '#fff', fontWeight: '700' },
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
  trayLabel: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '700', color: '#fff' },
  dragTreeWrap: { alignItems: 'center', justifyContent: 'center' },
});
