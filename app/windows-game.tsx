/**
 * EcoHero: Flood Fighters — Windows Game (Landscape Tablet)
 *
 * Compare single, double, and triple-layer windows.
 * More layers block more sun rays and keep people cooler.
 *
 * Uses the same 3D isometric house, CartoonPerson, Cloud, animated sun,
 * gradient rays, thermometer, ground, trees/bushes as the insulation game.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GameButton from '@/components/game/GameButton';
import LanguageToggle from '@/components/game/LanguageToggle';
import Thermometer from '@/components/game/Thermometer';
import { getLevelById } from '@/constants/gameData';
import {
  FontSizes,
  Fonts,
  GameColors,
  Radius,
  Spacing,
} from '@/constants/theme';
import type { TranslationKey } from '@/constants/i18n';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

type WindowLayer = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Responsive dimensions — full-screen landscape
// ---------------------------------------------------------------------------

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const SCENE_H = SCR_H - HEADER_H;

const THERMO_W = 80;

// 3D depth
const SIDE_D = 50;

// House front-face dimensions (centered: house + side + thermo block)
const PAD_H = 24;
const AVAIL_W = SCR_W - PAD_H * 2 - THERMO_W;
const H_W = Math.min((AVAIL_W - SIDE_D) * 0.46, 360);
const H_H = Math.min(SCENE_H * 0.6, 320);
const H_LEFT = Math.round(PAD_H + (AVAIL_W - H_W - SIDE_D) / 2);
const H_TOP = SCENE_H * 0.26;

const ROOF_H = 70;
const ROOF_OVERHANG = 24;
const WALL_H = H_H - ROOF_H - 14;

// Drop target for level 2 (big window) — screen coordinates
const WINDOW_DROP_LEFT = H_LEFT + H_W;
const WINDOW_DROP_TOP = HEADER_H + H_TOP + ROOF_H;
const WINDOW_DROP_WIDTH = SIDE_D;
const WINDOW_DROP_HEIGHT = WALL_H;

// Sun
const SUN_CX = (SCR_W - THERMO_W) * 0.86;
const SUN_CY = 24;

// ---------------------------------------------------------------------------
// Ray geometry helpers
// ---------------------------------------------------------------------------

interface RayDef {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function rayAngle(r: RayDef) {
  return Math.atan2(r.endY - r.startY, r.endX - r.startX) * (180 / Math.PI);
}
function rayLength(r: RayDef) {
  return Math.sqrt((r.endX - r.startX) ** 2 + (r.endY - r.startY) ** 2);
}

// Rays pass through the right window and reach INSIDE the house (where people are)
const PEOPLE_X = H_LEFT + H_W * 0.55;     // interior center-X
const PEOPLE_Y_TOP = H_TOP + ROOF_H + WALL_H * 0.25;
const PEOPLE_Y_BOT = H_TOP + ROOF_H + WALL_H * 0.85;

const RAYS: RayDef[] = [
  { id: 'r1', startX: SUN_CX - 4, startY: SUN_CY + 20, endX: PEOPLE_X + 30, endY: PEOPLE_Y_TOP },
  { id: 'r2', startX: SUN_CX,     startY: SUN_CY + 24, endX: PEOPLE_X + 10, endY: PEOPLE_Y_TOP + 20 },
  { id: 'r3', startX: SUN_CX + 3, startY: SUN_CY + 28, endX: PEOPLE_X + 40, endY: PEOPLE_Y_TOP + 40 },
  { id: 'r4', startX: SUN_CX + 6, startY: SUN_CY + 32, endX: PEOPLE_X,      endY: PEOPLE_Y_TOP + 60 },
  { id: 'r5', startX: SUN_CX - 2, startY: SUN_CY + 36, endX: PEOPLE_X + 20, endY: PEOPLE_Y_TOP + 80 },
  { id: 'r6', startX: SUN_CX + 4, startY: SUN_CY + 40, endX: PEOPLE_X + 50, endY: PEOPLE_Y_BOT - 30 },
  { id: 'r7', startX: SUN_CX + 8, startY: SUN_CY + 44, endX: PEOPLE_X + 5,  endY: PEOPLE_Y_BOT - 10 },
  { id: 'r8', startX: SUN_CX + 10, startY: SUN_CY + 48, endX: PEOPLE_X + 35, endY: PEOPLE_Y_BOT },
];

// Learn level: ray definitions per section (sun at 100,0 → end at endX, LEARN_RAY_END_Y)
const LEARN_RAY_END_X = [
  [50, 70, 90, 110, 130, 150],           // 6 rays (1 layer)
  [75, 100, 125],                         // 3 rays (2 layers)
  [100],                                  // 1 ray (3 layers)
];
const LEARN_RAY_START_X = 100;
const LEARN_RAY_START_Y = 0;
const LEARN_RAY_END_Y = 148; // rays pass through window area
function learnRayAngle(endX: number) {
  return Math.atan2(LEARN_RAY_END_Y - LEARN_RAY_START_Y, endX - LEARN_RAY_START_X) * (180 / Math.PI);
}
function learnRayLength(endX: number) {
  return Math.sqrt((LEARN_RAY_END_Y - LEARN_RAY_START_Y) ** 2 + (endX - LEARN_RAY_START_X) ** 2);
}

// ---------------------------------------------------------------------------
// Mood data (matching insulation game)
// ---------------------------------------------------------------------------

interface Mood {
  label: string;
  bg: string;
  skin: string;
  cheek: string;
  mouth: 'frown' | 'neutral' | 'smile' | 'grin';
  sweat: boolean;
  eyeStyle: 'squint' | 'normal' | 'happy';
}

function moodFromLayer(layer: WindowLayer, tFn: (k: TranslationKey) => string): Mood {
  if (layer === 1) {
    return {
      label: tFn('tooHot'),
      bg: '#FFCDD2',
      skin: '#FFAB91',
      cheek: '#EF5350',
      mouth: 'frown',
      sweat: true,
      eyeStyle: 'squint',
    };
  }
  if (layer === 2) {
    return {
      label: tFn('veryWarm'),
      bg: '#FFF9C4',
      skin: '#FFE0B2',
      cheek: '#FFB74D',
      mouth: 'neutral',
      sweat: false,
      eyeStyle: 'normal',
    };
  }
  return {
    label: tFn('niceCool'),
    bg: '#BBDEFB',
    skin: '#FFCCBC',
    cheek: '#EF9A9A',
    mouth: 'grin',
    sweat: false,
    eyeStyle: 'happy',
  };
}

// Temperature for each layer
function tempFromLayer(layer: WindowLayer): number {
  if (layer === 1) return 38;
  if (layer === 2) return 28;
  return 20;
}

// ---------------------------------------------------------------------------
// CartoonPerson (exact match with insulation game)
// ---------------------------------------------------------------------------

interface PersonProps {
  m: Mood;
  shirt: string;
  pants: string;
  hair: string;
  isChild?: boolean;
  isFemale?: boolean;
  hairBow?: string;
}

function CartoonPerson({ m, shirt, pants, hair, isChild, isFemale, hairBow }: PersonProps) {
  const s = isChild ? 0.72 : 1;
  const h = (v: number) => v * s;
  return (
    <View style={{ alignItems: 'center', width: h(52), height: h(110) }}>
      {/* Hair */}
      {isFemale ? (
        <>
          <View style={{ width: h(34), height: h(18), backgroundColor: hair, borderTopLeftRadius: h(17), borderTopRightRadius: h(17), marginBottom: -h(6), zIndex: 2 }} />
          <View style={{ position: 'absolute', top: h(12), left: h(4), width: h(8), height: h(28), backgroundColor: hair, borderBottomLeftRadius: h(6), zIndex: 0 }} />
          <View style={{ position: 'absolute', top: h(12), right: h(4), width: h(8), height: h(28), backgroundColor: hair, borderBottomRightRadius: h(6), zIndex: 0 }} />
          {hairBow && (
            <View style={{ position: 'absolute', top: h(2), right: h(6), width: h(10), height: h(10), backgroundColor: hairBow, borderRadius: h(5), zIndex: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
          )}
        </>
      ) : (
        <View style={{ width: h(32), height: h(14), backgroundColor: hair, borderTopLeftRadius: h(16), borderTopRightRadius: h(16), marginBottom: -h(4), zIndex: 2 }} />
      )}
      {/* Head */}
      <View style={{ width: h(30), height: h(30), borderRadius: h(15), backgroundColor: m.skin, zIndex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Eyes */}
        <View style={{ flexDirection: 'row', gap: h(8), marginTop: -h(2) }}>
          {m.eyeStyle === 'squint' ? (
            <>
              <View style={{ width: h(7), height: h(3), backgroundColor: '#5D4037', borderRadius: h(2) }} />
              <View style={{ width: h(7), height: h(3), backgroundColor: '#5D4037', borderRadius: h(2) }} />
            </>
          ) : m.eyeStyle === 'happy' ? (
            <>
              <View style={{ width: h(7), height: h(4), borderTopWidth: h(2.5), borderColor: '#5D4037', borderTopLeftRadius: h(5), borderTopRightRadius: h(5), backgroundColor: 'transparent' }} />
              <View style={{ width: h(7), height: h(4), borderTopWidth: h(2.5), borderColor: '#5D4037', borderTopLeftRadius: h(5), borderTopRightRadius: h(5), backgroundColor: 'transparent' }} />
            </>
          ) : (
            <>
              <View style={{ width: h(5), height: h(5), borderRadius: h(3), backgroundColor: '#5D4037' }} />
              <View style={{ width: h(5), height: h(5), borderRadius: h(3), backgroundColor: '#5D4037' }} />
            </>
          )}
        </View>
        {/* Cheeks */}
        <View style={{ flexDirection: 'row', gap: h(14), marginTop: h(1) }}>
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
        </View>
        {/* Mouth */}
        <View style={{ marginTop: h(1) }}>
          {m.mouth === 'frown' ? (
            <View style={{ width: h(10), height: h(5), borderBottomWidth: h(2.5), borderColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6), transform: [{ rotate: '180deg' }] }} />
          ) : m.mouth === 'neutral' ? (
            <View style={{ width: h(8), height: h(2.5), backgroundColor: '#5D4037', borderRadius: h(1) }} />
          ) : m.mouth === 'smile' ? (
            <View style={{ width: h(10), height: h(5), borderBottomWidth: h(2.5), borderColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} />
          ) : (
            <View style={{ width: h(12), height: h(7), backgroundColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} />
          )}
        </View>
        {/* Sweat */}
        {m.sweat && (
          <View style={{ position: 'absolute', right: -h(2), top: h(6), width: h(6), height: h(9), borderRadius: h(3), backgroundColor: '#64B5F6' }} />
        )}
      </View>
      {/* Body */}
      {isFemale ? (
        <>
          <View style={{ width: h(26), height: h(18), backgroundColor: shirt, borderTopLeftRadius: h(4), borderTopRightRadius: h(4), marginTop: h(1), alignItems: 'center' }}>
            <View style={{ width: h(2), height: h(14), backgroundColor: 'rgba(0,0,0,0.08)', marginTop: h(2) }} />
          </View>
          <View style={{ width: h(34), height: h(16), backgroundColor: pants, borderBottomLeftRadius: h(12), borderBottomRightRadius: h(12) }} />
        </>
      ) : (
        <View style={{ width: h(26), height: h(28), backgroundColor: shirt, borderTopLeftRadius: h(4), borderTopRightRadius: h(4), marginTop: h(1), alignItems: 'center' }}>
          <View style={{ width: h(2), height: h(22), backgroundColor: 'rgba(0,0,0,0.08)', marginTop: h(2) }} />
        </View>
      )}
      {/* Arms */}
      <View style={{ position: 'absolute', top: h(46), flexDirection: 'row', width: h(52), justifyContent: 'space-between' }}>
        <View style={{ width: h(9), height: h(22), backgroundColor: m.skin, borderRadius: h(4), transform: [{ rotate: '12deg' }] }} />
        <View style={{ width: h(9), height: h(22), backgroundColor: m.skin, borderRadius: h(4), transform: [{ rotate: '-12deg' }] }} />
      </View>
      {/* Legs */}
      {isFemale ? (
        <View style={{ flexDirection: 'row', gap: h(3) }}>
          <View style={{ width: h(9), height: h(18), backgroundColor: m.skin, borderBottomLeftRadius: h(4), borderBottomRightRadius: h(4) }} />
          <View style={{ width: h(9), height: h(18), backgroundColor: m.skin, borderBottomLeftRadius: h(4), borderBottomRightRadius: h(4) }} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: h(3) }}>
          <View style={{ width: h(11), height: h(24), backgroundColor: pants, borderBottomLeftRadius: h(4), borderBottomRightRadius: h(4) }} />
          <View style={{ width: h(11), height: h(24), backgroundColor: pants, borderBottomLeftRadius: h(4), borderBottomRightRadius: h(4) }} />
        </View>
      )}
      {/* Shoes */}
      <View style={{ flexDirection: 'row', gap: h(3), marginTop: -h(1) }}>
        <View style={{ width: h(13), height: h(5), backgroundColor: isFemale ? '#AD1457' : '#5D4037', borderRadius: h(3) }} />
        <View style={{ width: h(13), height: h(5), backgroundColor: isFemale ? '#AD1457' : '#5D4037', borderRadius: h(3) }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cloud (exact match with insulation game)
// ---------------------------------------------------------------------------

function Cloud({ left, top, size }: { left: number; top: number; size: number }) {
  const s = size;
  return (
    <View style={{ position: 'absolute', left, top, flexDirection: 'row', zIndex: 1 }}>
      <View style={{ width: s * 0.6, height: s * 0.45, borderRadius: s * 0.25, backgroundColor: 'rgba(255,255,255,0.85)', marginTop: s * 0.15 }} />
      <View style={{ width: s, height: s * 0.6, borderRadius: s * 0.3, backgroundColor: 'rgba(255,255,255,0.9)', marginLeft: -s * 0.15 }} />
      <View style={{ width: s * 0.7, height: s * 0.5, borderRadius: s * 0.25, backgroundColor: 'rgba(255,255,255,0.85)', marginLeft: -s * 0.15, marginTop: s * 0.12 }} />
    </View>
  );
}

// ============================================================================
// SCREEN
// ============================================================================

export default function WindowsGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();
  const { t, lang } = useLanguage();

  const level = getLevelById(levelId ?? 'w5-l1');
  const isPracticeLevel = levelId === 'w5-l2';
  const [layer, setLayer] = useState<WindowLayer | null>(isPracticeLevel ? null : 1);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [showDragHintModal, setShowDragHintModal] = useState(false);

  const isLearnLevel = levelId === 'w5-l1';

  // When no selection (level 2), show 1-layer scene; otherwise use selected layer
  const displayLayer = layer ?? 1;
  const visibleRays = displayLayer === 1 ? 8 : displayLayer === 2 ? 4 : 1;
  const moodVal = moodFromLayer(displayLayer, t);
  const currentTemp = tempFromLayer(displayLayer);

  const score = useMemo(() => {
    if (!layer) return 0;
    if (layer === 1) return 10;
    if (layer === 2) return 20;
    return 30;
  }, [layer]);

  // ---- Animations ----
  const sunScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunScale, { toValue: 1.06, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sunScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const cloudX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudX, { toValue: 18, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudX, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const windowZonePulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(windowZonePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(windowZonePulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const finishLevel = (finalScore?: number, finalMax?: number) => {
    const sc = finalScore ?? score;
    const max = finalMax ?? 30;
    const stars = completeLevel(level?.id ?? 'w5-l1', sc, max);
    setTimeout(() => {
      router.replace({
        pathname: '/level-complete',
        params: {
          levelId: level?.id ?? 'w5-l1',
          stars: String(stars),
          score: String(sc),
          maxScore: String(max),
        },
      });
    }, 2000);
  };

  const finishLearnLevel = () => {
    completeLevel('w5-l1', 30, 30);
    router.replace({
      pathname: '/level-complete',
      params: { levelId: 'w5-l1', stars: '3', score: '30', maxScore: '30' },
    });
  };

  const tryAgainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (tryAgainTimeoutRef.current) clearTimeout(tryAgainTimeoutRef.current);
  }, []);

  const handleLayerPress = (l: WindowLayer) => {
    setLayer(l);
    if (isPracticeLevel) {
      if (tryAgainTimeoutRef.current) {
        clearTimeout(tryAgainTimeoutRef.current);
        tryAgainTimeoutRef.current = null;
      }
      if (l === 3) {
        finishLevel(30, 30);
      } else {
        tryAgainTimeoutRef.current = setTimeout(() => {
          tryAgainTimeoutRef.current = null;
          setShowTryAgainModal(true);
        }, 2000);
      }
    }
  };

  const applyLayerRef = useRef(handleLayerPress);
  useEffect(() => {
    applyLayerRef.current = handleLayerPress;
  }, [handleLayerPress]);

  // ---- Level 2: drag and drop onto the big window ----
  const [isDraggingL1, setIsDraggingL1] = useState(false);
  const [isDraggingL2, setIsDraggingL2] = useState(false);
  const [isDraggingL3, setIsDraggingL3] = useState(false);
  const dragL1 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragL2 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragL3 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleL1 = useRef(new Animated.Value(1)).current;
  const scaleL2 = useRef(new Animated.Value(1)).current;
  const scaleL3 = useRef(new Animated.Value(1)).current;

  const sceneRef = useRef<View>(null);

  const tryDropWindow = useCallback((layerChoice: WindowLayer, moveX: number, moveY: number, sceneX?: number, sceneY?: number) => {
    const left = sceneX !== undefined && sceneY !== undefined ? sceneX + H_LEFT + H_W : WINDOW_DROP_LEFT;
    const top = sceneX !== undefined && sceneY !== undefined ? sceneY + H_TOP + ROOF_H : WINDOW_DROP_TOP;
    if (
      moveX >= left &&
      moveX <= left + WINDOW_DROP_WIDTH &&
      moveY >= top &&
      moveY <= top + WINDOW_DROP_HEIGHT
    ) {
      applyLayerRef.current(layerChoice);
    }
  }, []);
  const tryDropWindowRef = useRef(tryDropWindow);
  useEffect(() => {
    tryDropWindowRef.current = tryDropWindow;
  }, [tryDropWindow]);

  const runDropWithMeasure = useCallback((layerChoice: WindowLayer, moveX: number, moveY: number) => {
    (sceneRef.current as any)?.measureInWindow?.((sx: number, sy: number) => {
      tryDropWindowRef.current(layerChoice, moveX, moveY, sx, sy);
    });
  }, []);
  const runDropWithMeasureRef = useRef(runDropWithMeasure);
  useEffect(() => {
    runDropWithMeasureRef.current = runDropWithMeasure;
  }, [runDropWithMeasure]);

  const makeWindowPanResponder = useCallback(
    (
      layerChoice: WindowLayer,
      dragXY: Animated.ValueXY,
      scaleVal: Animated.Value,
      setDragging: (v: boolean) => void,
    ) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
        onPanResponderGrant: () => {
          setDragging(true);
          dragXY.setOffset({ x: (dragXY.x as any)._value ?? 0, y: (dragXY.y as any)._value ?? 0 });
          dragXY.setValue({ x: 0, y: 0 });
          Animated.spring(scaleVal, { toValue: 1.2, useNativeDriver: true }).start();
        },
        onPanResponderMove: (_, g) => {
          dragXY.setValue({ x: g.dx, y: g.dy });
        },
        onPanResponderRelease: (_, g) => {
          setDragging(false);
          dragXY.flattenOffset();
          Animated.spring(scaleVal, { toValue: 1, useNativeDriver: true }).start();
          runDropWithMeasureRef.current(layerChoice, g.moveX, g.moveY);
          Animated.spring(dragXY, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        },
      }),
    [],
  );

  const panL1 = useRef(
    makeWindowPanResponder(1, dragL1, scaleL1, setIsDraggingL1),
  ).current;
  const panL2 = useRef(
    makeWindowPanResponder(2, dragL2, scaleL2, setIsDraggingL2),
  ).current;
  const panL3 = useRef(
    makeWindowPanResponder(3, dragL3, scaleL3, setIsDraggingL3),
  ).current;

  // Window glass color for the big side window — changes with layer count
  const windowGlass = displayLayer === 1 ? '#B3E5FC' : displayLayer === 2 ? '#81D4FA' : '#4DD0E1';

  // Moods for the three learn sections (1, 2, 3 layers)
  const mood1 = moodFromLayer(1, t);
  const mood2 = moodFromLayer(2, t);
  const mood3 = moodFromLayer(3, t);

  // ===== LEARN LEVEL: Three sections — order: text → sun → layer (with rays) → humans =====
  if (isLearnLevel) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>{'\u2190'}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]}>{t('learnLayersTitle')}</Text>
          <View style={{ flex: 1 }} />
          <LanguageToggle />
        </View>
        <ScrollView
          style={styles.learnScroll}
          contentContainerStyle={styles.learnSectionsWrap}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: 1 layer — sun (same as Add the Right Window) → rays → window → humans */}
          <View style={styles.learnSection}>
            <Text style={[styles.learnSectionText, lang === 'ur' && styles.rtl]}>{t('learnSection1')}</Text>
            <View style={styles.learnSunRayWrap}>
              <Animated.View style={[styles.learnSunWrap, { transform: [{ scale: sunScale }] }]}>
                <View style={styles.learnSunGlow3} />
                <View style={styles.learnSunGlow2} />
                <View style={styles.learnSunGlow1} />
                <Text style={styles.learnSunEmoji}>{'\u2600\uFE0F'}</Text>
              </Animated.View>
              <View style={styles.learnRayContainer}>
                {LEARN_RAY_END_X[0].map((endX, i) => (
                  <View
                    key={i}
                    style={[styles.learnRayBar, {
                      left: LEARN_RAY_START_X,
                      width: learnRayLength(endX),
                      transform: [{ rotate: `${learnRayAngle(endX)}deg` }],
                    }]}
                  >
                    <LinearGradient
                      colors={['rgba(255,210,0,0.75)', 'rgba(255,165,0,0.3)', 'rgba(255,120,0,0.06)']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                ))}
                <View style={[styles.learnWindowOverlay, { backgroundColor: 'rgba(179,229,252,0.92)' }]}>
                  <Text style={styles.learnWindowLabel}>1x</Text>
                </View>
              </View>
            </View>
            <View style={styles.learnPeopleRow}>
              <CartoonPerson m={mood1} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
              <CartoonPerson m={mood1} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
              <CartoonPerson m={mood1} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
              <CartoonPerson m={mood1} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
            </View>
          </View>

          {/* Section 2: 2 layers — sun → rays → window → humans */}
          <View style={styles.learnSection}>
            <Text style={[styles.learnSectionText, lang === 'ur' && styles.rtl]}>{t('learnSection2')}</Text>
            <View style={styles.learnSunRayWrap}>
              <Animated.View style={[styles.learnSunWrap, { transform: [{ scale: sunScale }] }]}>
                <View style={styles.learnSunGlow3} />
                <View style={styles.learnSunGlow2} />
                <View style={styles.learnSunGlow1} />
                <Text style={styles.learnSunEmoji}>{'\u2600\uFE0F'}</Text>
              </Animated.View>
              <View style={styles.learnRayContainer}>
                {LEARN_RAY_END_X[1].map((endX, i) => (
                  <View
                    key={i}
                    style={[styles.learnRayBar, {
                      left: LEARN_RAY_START_X,
                      width: learnRayLength(endX),
                      transform: [{ rotate: `${learnRayAngle(endX)}deg` }],
                    }]}
                  >
                    <LinearGradient
                      colors={['rgba(255,210,0,0.75)', 'rgba(255,165,0,0.3)', 'rgba(255,120,0,0.06)']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                ))}
                <View style={[styles.learnWindowOverlay, { backgroundColor: 'rgba(129,212,250,0.92)' }]}>
                  <View style={styles.learnWindowInner} />
                  <Text style={styles.learnWindowLabel}>2x</Text>
                </View>
              </View>
            </View>
            <View style={styles.learnPeopleRow}>
              <CartoonPerson m={mood2} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
              <CartoonPerson m={mood2} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
              <CartoonPerson m={mood2} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
              <CartoonPerson m={mood2} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
            </View>
          </View>

          {/* Section 3: 3 layers — sun → rays → window → humans */}
          <View style={styles.learnSection}>
            <Text style={[styles.learnSectionText, lang === 'ur' && styles.rtl]}>{t('learnSection3')}</Text>
            <View style={styles.learnSunRayWrap}>
              <Animated.View style={[styles.learnSunWrap, { transform: [{ scale: sunScale }] }]}>
                <View style={styles.learnSunGlow3} />
                <View style={styles.learnSunGlow2} />
                <View style={styles.learnSunGlow1} />
                <Text style={styles.learnSunEmoji}>{'\u2600\uFE0F'}</Text>
              </Animated.View>
              <View style={styles.learnRayContainer}>
                {LEARN_RAY_END_X[2].map((endX, i) => (
                  <View
                    key={i}
                    style={[styles.learnRayBar, {
                      left: LEARN_RAY_START_X,
                      width: learnRayLength(endX),
                      transform: [{ rotate: `${learnRayAngle(endX)}deg` }],
                    }]}
                  >
                    <LinearGradient
                      colors={['rgba(255,210,0,0.75)', 'rgba(255,165,0,0.3)', 'rgba(255,120,0,0.06)']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                ))}
                <View style={[styles.learnWindowOverlay, { backgroundColor: 'rgba(77,208,225,0.92)' }]}>
                  <View style={styles.learnWindowInner} />
                  <View style={[styles.learnWindowInner, styles.learnWindowInner2]} />
                  <Text style={styles.learnWindowLabel}>3x</Text>
                </View>
              </View>
            </View>
            <View style={styles.learnPeopleRow}>
              <CartoonPerson m={mood3} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
              <CartoonPerson m={mood3} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
              <CartoonPerson m={mood3} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
              <CartoonPerson m={mood3} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
            </View>
          </View>
        </ScrollView>

        {/* Continue: right bottom, light green bg, text then white arrow */}
        <Pressable style={styles.learnContinueWrap} onPress={finishLearnLevel}>
          <Text style={[styles.learnContinueText, lang === 'ur' && styles.rtl]}>{t('continueBtn')}</Text>
          <Text style={styles.learnContinueArrow}>{'\u27A1'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />

      {/* ===== COMPACT HEADER ===== */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]}>
          {isPracticeLevel ? t('addRightWindowTitle') : t('windowLayers')}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.headerSub, lang === 'ur' && styles.rtl]}>
          {t('raysPassing')}: {visibleRays}/8
        </Text>
        <LanguageToggle />
        <Pressable onPress={() => setShowDragHintModal(true)} style={styles.infoBtn} hitSlop={8}>
          <Text style={styles.infoIcon}>{'\u2139'}</Text>
        </Pressable>
      </View>

      {/* ===== LEFT: drag items | CENTER/RIGHT: scene + thermometer ===== */}
      <View style={styles.mainRow}>
        <View style={styles.leftDragColumn}>
          {!isPracticeLevel && (
            <Text style={[styles.helper, lang === 'ur' && styles.rtl]}>{t('chooseWindow')}</Text>
          )}
          <View style={styles.layerButtonsColumn}>
            {isPracticeLevel ? (
              <>
                <Animated.View
                  {...panL1.panHandlers}
                  style={[
                    styles.layerButtonWrap,
                    { transform: [...dragL1.getTranslateTransform(), { scale: scaleL1 }], zIndex: isDraggingL1 ? 100 : 1 },
                  ]}
                >
                  <Pressable style={[styles.layerBtn, layer === 1 && styles.layerBtnActive]} onPress={() => handleLayerPress(1)}>
                    <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F'}</Text>
                    <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('singleLayer')}</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View
                  {...panL2.panHandlers}
                  style={[
                    styles.layerButtonWrap,
                    { transform: [...dragL2.getTranslateTransform(), { scale: scaleL2 }], zIndex: isDraggingL2 ? 100 : 1 },
                  ]}
                >
                  <Pressable style={[styles.layerBtn, layer === 2 && styles.layerBtnActive2]} onPress={() => handleLayerPress(2)}>
                    <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F\uD83E\uDE9F'}</Text>
                    <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('doubleLayer')}</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View
                  {...panL3.panHandlers}
                  style={[
                    styles.layerButtonWrap,
                    { transform: [...dragL3.getTranslateTransform(), { scale: scaleL3 }], zIndex: isDraggingL3 ? 100 : 1 },
                  ]}
                >
                  <Pressable style={[styles.layerBtn, layer === 3 && styles.layerBtnActive3]} onPress={() => handleLayerPress(3)}>
                    <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F\uD83E\uDE9F\uD83E\uDE9F'}</Text>
                    <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('tripleLayer')}</Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : (
              <>
                <Pressable style={[styles.layerBtn, layer === 1 && styles.layerBtnActive]} onPress={() => handleLayerPress(1)}>
                  <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F'}</Text>
                  <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('singleLayer')}</Text>
                </Pressable>
                <Pressable style={[styles.layerBtn, layer === 2 && styles.layerBtnActive2]} onPress={() => handleLayerPress(2)}>
                  <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F\uD83E\uDE9F'}</Text>
                  <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('doubleLayer')}</Text>
                </Pressable>
                <Pressable style={[styles.layerBtn, layer === 3 && styles.layerBtnActive3]} onPress={() => handleLayerPress(3)}>
                  <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F\uD83E\uDE9F\uD83E\uDE9F'}</Text>
                  <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('tripleLayer')}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
        <View ref={sceneRef} style={styles.scene} collapsable={false}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

        {/* Clouds */}
        <Animated.View style={{ transform: [{ translateX: cloudX }] }}>
          <Cloud left={SCR_W * 0.05} top={14} size={52} />
          <Cloud left={SCR_W * 0.28} top={6} size={44} />
          <Cloud left={SCR_W * 0.52} top={20} size={38} />
        </Animated.View>

        {/* Sun */}
        <Animated.View style={[styles.sun, { transform: [{ scale: sunScale }] }]}>
          <View style={styles.sunGlow3} />
          <View style={styles.sunGlow2} />
          <View style={styles.sunGlow1} />
          <Text style={styles.sunEmoji}>{'\u2600\uFE0F'}</Text>
        </Animated.View>

        {/* Urdu/En label near the sun */}
        <View style={styles.sunLabel}>
          <Text style={styles.sunLabelText}>{t('sunScorching')}</Text>
        </View>

        {/* Rays */}
        {RAYS.slice(0, visibleRays).map((r) => (
          <View
            key={r.id}
            style={[styles.ray, {
              left: r.startX,
              top: r.startY - 4,
              width: rayLength(r),
              transform: [{ rotate: `${rayAngle(r)}deg` }],
            }]}
          >
            <LinearGradient
              colors={['rgba(255,210,0,0.75)', 'rgba(255,165,0,0.3)', 'rgba(255,120,0,0.06)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ))}

        {/* ======= 3D HOUSE ======= */}
        <View style={styles.houseWrap}>

          {/* ---- GROUND SHADOW ---- */}
          <View style={styles.groundShadow} />

          {/* ---- 3D: RIGHT SIDE = BIG WINDOW (replaces brick wall) ---- */}
          <View style={[styles.sideWall, { backgroundColor: windowGlass }]}>
            {/* Window frame border */}
            <View style={styles.sideWindowBorder}>
              {/* Layer 2 inner pane */}
              {displayLayer >= 2 && <View style={styles.sideWindowLayer2} />}
              {/* Layer 3 inner pane */}
              {displayLayer >= 3 && <View style={styles.sideWindowLayer3} />}
              {/* Cross bars removed */}
              {/* Layer label */}
              <View style={styles.sideWindowLabelWrap}>
                <Text style={styles.sideWindowLabel}>{displayLayer}x</Text>
              </View>
            </View>
          </View>

          {/* (Side roof & foundation side removed — window is flat/straight) */}

          {/* ---- CHIMNEY (front face) ---- */}
          <View style={styles.chimney}>
            <View style={styles.chimneyTop} />
            <View style={styles.chimneyFront} />
          </View>

          {/* ---- FRONT ROOF (triangle, zIndex 2) ---- */}
          <View style={styles.frontRoof}>
            <View style={[styles.roofTriangle, {
              borderLeftWidth: (H_W + ROOF_OVERHANG) / 2,
              borderRightWidth: (H_W + ROOF_OVERHANG) / 2,
              borderBottomWidth: ROOF_H,
            }]} />
            <View style={[styles.roofRidge, { width: H_W * 0.08 }]} />
            {[0.3, 0.55, 0.8].map((pct, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: ROOF_H * pct,
                  left: ROOF_OVERHANG / 2 + H_W * (0.5 - pct * 0.48),
                  right: ROOF_OVERHANG / 2 + H_W * (0.5 - pct * 0.48),
                  height: 2,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  borderRadius: 1,
                }}
              />
            ))}
            <View style={styles.roofShadow} />
          </View>

          {/* ---- FRONT WALLS (zIndex 2) ---- */}
          <View style={styles.frontWalls}>
            {/* Left brick panel */}
            <View style={styles.wallPanel}>
              {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 12 }]}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <View key={j} style={styles.brick} />
                  ))}
                </View>
              ))}
            </View>

            {/* Interior */}
            <View style={[styles.interior, { backgroundColor: moodVal.bg }]}>
              <View style={styles.floorLine} />
              <View style={styles.table}>
                <View style={styles.tableTop} />
                <View style={styles.tableLeg} />
              </View>

              {/* Decorative window (like insulation game decoWindowL) */}
              <View style={styles.decoWindowL}>
                <View style={styles.decoWindowPane} />
                <View style={styles.decoWindowCross} />
                <View style={styles.decoWindowCrossH} />
              </View>

              {/* People: 1 man, 1 woman, 1 boy, 1 girl */}
              <View style={styles.peopleRow}>
                <CartoonPerson m={moodVal} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
                <CartoonPerson m={moodVal} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
                <CartoonPerson m={moodVal} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
                <CartoonPerson m={moodVal} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
              </View>
              <Text style={[styles.moodLabel, {
                color: moodVal.bg === '#BBDEFB' ? '#1565C0' : moodVal.bg === '#FFCDD2' ? '#C62828' : '#E65100',
              }]}>
                {moodVal.label}
              </Text>
              <View style={[styles.heatWavesRow, currentTemp < 32 && { opacity: 0 }]}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.heatWaveLine} />
                ))}
              </View>
            </View>

            {/* Right brick panel (front face edge) */}
            <View style={styles.wallPanelR}>
              {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 10 }]}>
                  <View style={styles.brick} />
                </View>
              ))}
            </View>
          </View>

          {/* ---- DOOR (on front face) ---- */}
          <View style={styles.doorWrap}>
            <View style={styles.door}>
              <View style={styles.doorInner}>
                <View style={styles.doorKnob} />
              </View>
              <View style={styles.doorArch} />
            </View>
            <View style={styles.doorStep} />
          </View>

          {/* ---- FOUNDATION (front) ---- */}
          <View style={styles.foundation} />
        </View>

        {/* Ground */}
        <View style={styles.ground}>
          <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
        </View>
        <Text style={[styles.tree, { left: H_LEFT - 60, bottom: SCENE_H - H_TOP - H_H + 6 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.tree, { left: H_LEFT + H_W + SIDE_D + 20, bottom: SCENE_H - H_TOP - H_H + 10 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT - 20 }]}>{'\u{1F33F}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT + H_W + SIDE_D + 60 }]}>{'\u{1F33F}'}</Text>

        {/* Thermometer (right) */}
        <View style={styles.thermoPos}>
          <Thermometer temperature={currentTemp} />
        </View>

        {/* Drop target overlay (level 2: highlighted box only) */}
        {isPracticeLevel && layer === null && (
          <View
            pointerEvents="none"
            style={[styles.windowDropZone, { left: H_LEFT + H_W, top: H_TOP + ROOF_H, width: SIDE_D, height: WALL_H }]}
          >
            <Animated.View style={[styles.windowZoneActive, { opacity: windowZonePulse }]} />
          </View>
        )}
      </View>
      </View>

      {/* Try Again modal (practice level: wrong layer chosen) */}
      <Modal
        visible={showTryAgainModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTryAgainModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTryAgainModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, lang === 'ur' && styles.rtl]}>{t('tryAgainDialogTitle')}</Text>
            <Text style={[styles.modalMessage, lang === 'ur' && styles.rtl]}>{t('tryAgainDialogMessage')}</Text>
            <GameButton
              title={t('retry')}
              emoji={'\u{1F504}'}
              onPress={() => setShowTryAgainModal(false)}
              color={GameColors.sun}
              textColor={GameColors.primaryDark}
              size="md"
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Drag & drop hint (info icon) */}
      <Modal
        visible={showDragHintModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDragHintModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDragHintModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalMessage, lang === 'ur' && styles.rtl]}>{t('dragDropHint')}</Text>
            <GameButton
              title={t('back')}
              onPress={() => setShowDragHintModal(false)}
              color={GameColors.primary}
              textColor="#fff"
              size="md"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  root: { flex: 1 },
  rtl: { writingDirection: 'rtl' },

  // Learn level (w5-l1)
  learnContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
    maxWidth: 520,
    alignSelf: 'center',
  },
  learnBody: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    lineHeight: 26,
    color: GameColors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  // Learn level: three sections — order: text → sun → layer (rays through) → humans
  learnScroll: { flex: 1 },
  learnSectionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 72,
    gap: Spacing.lg,
  },
  learnSection: {
    width: 200,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  learnSectionText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: GameColors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
    minHeight: 36,
  },
  learnSunRayWrap: {
    alignItems: 'center',
    width: '100%',
  },
  learnSunWrap: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  learnSunGlow3: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,235,59,0.12)' },
  learnSunGlow2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,235,59,0.2)' },
  learnSunGlow1: { position: 'absolute', width: 49, height: 49, borderRadius: 24.5, backgroundColor: 'rgba(255,235,59,0.35)' },
  learnSunEmoji: { fontSize: 32 },
  learnRayContainer: {
    position: 'relative',
    width: 200,
    height: 148,
    marginBottom: 0,
  },
  learnRayBar: {
    position: 'absolute',
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    transformOrigin: 'left center',
    top: -4.5,
  },
  learnWindowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    width: 120,
    height: 88,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#5D4037',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  learnPeopleRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    width: '100%',
  },
  learnWindowBox: {
    width: 120,
    height: 88,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#5D4037',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  learnWindowInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(2,136,209,0.5)',
    borderRadius: 4,
    backgroundColor: 'rgba(3,169,244,0.25)',
  },
  learnWindowInner2: {
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
  },
  learnWindowLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '900',
    color: '#004D40',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  learnContinueWrap: {
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
  learnContinueText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#ffff',
  },
  learnContinueArrow: { fontSize: 20, color: '#fff', fontWeight: '700' },

  // Try Again modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '900',
    color: '#C62828',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    color: GameColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0,131,143,0.92)',
    gap: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerTitle: { fontFamily: Fonts.rounded, fontSize: FontSizes.lg, fontWeight: '900', color: '#fff' },
  headerSub: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },

  // Scene
  scene: { flex: 1, position: 'relative', overflow: 'hidden' },

  // Sun
  sun: {
    position: 'absolute',
    right: THERMO_W + 20,
    top: 4,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sunGlow3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,235,59,0.12)' },
  sunGlow2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,235,59,0.2)' },
  sunGlow1: { position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255,235,59,0.35)' },
  sunEmoji: { fontSize: 58 },

  // Sun label
  sunLabel: {
    position: 'absolute',
    right: THERMO_W + 16,
    top: 88,
    backgroundColor: 'rgba(255,111,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 11,
  },
  sunLabelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  // Rays
  ray: {
    position: 'absolute',
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    transformOrigin: 'left center',
    zIndex: 5,
  },

  // ---- 3D HOUSE ----
  houseWrap: {
    position: 'absolute',
    left: H_LEFT,
    top: H_TOP,
    width: H_W + SIDE_D + 10,
    height: H_H + 30,
    zIndex: 3,
  },

  // Ground shadow
  groundShadow: {
    position: 'absolute',
    left: 10,
    top: H_H + 4,
    width: H_W + SIDE_D - 10,
    height: 18,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 100,
    zIndex: 0,
  },

  // ---- Right wall = big window (straight, no skew) ----
  sideWall: {
    position: 'absolute',
    left: H_W,
    top: ROOF_H,
    width: SIDE_D,
    height: WALL_H,
    overflow: 'hidden',
    zIndex: 2,
    borderRightWidth: 3,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: '#5D4037',
    borderRadius: 2,
  },
  sideWindowBorder: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#8D6E63',
    margin: 2,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideWindowLayer2: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(3,169,244,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(2,136,209,0.5)',
    borderRadius: 1,
  },
  sideWindowLayer3: {
    position: 'absolute',
    top: 9,
    left: 8,
    right: 8,
    bottom: 9,
    backgroundColor: 'rgba(0,188,212,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(0,131,143,0.5)',
    borderRadius: 1,
  },
  sideWindowLabelWrap: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 3,
  },
  sideWindowLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 12,
    fontWeight: '900',
    color: '#004D40',
  },

  // ---- Chimney ----
  chimney: {
    position: 'absolute',
    left: H_W * 0.17,
    top: -28,
    zIndex: 5,
  },
  chimneyTop: {
    width: 32,
    height: 8,
    backgroundColor: '#5D4037',
    borderRadius: 3,
    zIndex: 2,
  },
  chimneyFront: {
    width: 24,
    height: 34,
    backgroundColor: '#795548',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: 4,
  },

  // ---- Front roof ----
  frontRoof: {
    position: 'absolute',
    left: -ROOF_OVERHANG / 2,
    top: 0,
    width: H_W + ROOF_OVERHANG,
    height: ROOF_H,
    alignItems: 'center',
    zIndex: 2,
  },
  roofTriangle: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8D6E63',
    borderStyle: 'solid',
  },
  roofRidge: {
    height: 6,
    backgroundColor: '#6D4C41',
    borderRadius: 3,
    marginTop: -ROOF_H - 3,
  },
  roofShadow: {
    position: 'absolute',
    bottom: -4,
    left: ROOF_OVERHANG / 2,
    right: ROOF_OVERHANG / 2,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  // ---- Front walls ----
  frontWalls: {
    position: 'absolute',
    left: 0,
    top: ROOF_H,
    width: H_W,
    height: WALL_H,
    flexDirection: 'row',
    overflow: 'hidden',
    borderBottomLeftRadius: 3,
    zIndex: 2,
  },
  wallPanel: { width: 28, backgroundColor: '#D7CCC8', overflow: 'hidden' },
  wallPanelR: { width: 16, backgroundColor: '#D7CCC8', overflow: 'hidden' },
  brickRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  brick: {
    width: 22,
    height: 14,
    backgroundColor: '#BCAAA4',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#A1887F',
  },
  interior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  floorLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#8D6E63',
  },
  table: { position: 'absolute', bottom: 8, right: 20, alignItems: 'center' },
  tableTop: { width: 36, height: 6, backgroundColor: '#8D6E63', borderRadius: 2 },
  tableLeg: { width: 4, height: 18, backgroundColor: '#6D4C41' },

  // Decorative window inside the house (matches insulation game decoWindowL)
  decoWindowL: {
    position: 'absolute',
    left: 14,
    top: 18,
    width: 42,
    height: 42,
    backgroundColor: '#B3E5FC',
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#8D6E63',
    overflow: 'hidden',
  },
  decoWindowPane: { ...StyleSheet.absoluteFillObject, backgroundColor: '#B3E5FC' },
  decoWindowCross: { position: 'absolute', left: '48%', top: 0, bottom: 0, width: 3, backgroundColor: '#8D6E63' },
  decoWindowCrossH: { position: 'absolute', top: '48%', left: 0, right: 0, height: 3, backgroundColor: '#8D6E63' },

  // People
  peopleRow: {
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  moodLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '800',
    zIndex: 2,
    marginTop: 2,
  },
  heatWavesRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  heatWaveLine: {
    width: 3,
    height: 14,
    backgroundColor: '#FF7043',
    borderRadius: 2,
    opacity: 0.6,
    transform: [{ rotate: '8deg' }],
  },

  // ---- Door ----
  doorWrap: {
    position: 'absolute',
    left: H_W / 2 - 22,
    top: H_H - 72,
    alignItems: 'center',
    zIndex: 3,
  },
  door: {
    width: 40,
    height: 58,
    backgroundColor: '#5D4037',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    overflow: 'hidden',
  },
  doorInner: {
    width: 32,
    height: 44,
    backgroundColor: '#4E342E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
  },
  doorKnob: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD54F' },
  doorArch: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    height: 22,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  doorStep: {
    width: 52,
    height: 8,
    backgroundColor: '#78909C',
    borderRadius: 2,
    marginTop: 1,
    borderBottomWidth: 3,
    borderBottomColor: '#546E7A',
    borderRightWidth: 3,
    borderRightColor: '#607D8B',
  },

  // ---- Foundation (front) ----
  foundation: {
    position: 'absolute',
    left: 0,
    top: H_H - 14,
    width: H_W,
    height: 10,
    backgroundColor: '#78909C',
    borderRadius: 2,
    zIndex: 2,
  },

  // Ground
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCENE_H * 0.16,
    zIndex: 2,
  },
  tree: { position: 'absolute', fontSize: 48, zIndex: 3 },
  bush: { position: 'absolute', bottom: 4, fontSize: 26, zIndex: 3 },

  // Thermometer
  thermoPos: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    width: THERMO_W,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  // Left column for drag items (thermometer stays right in scene)
  mainRow: { flex: 1, flexDirection: 'row' },
  leftDragColumn: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  layerButtonsColumn: { flexDirection: 'column', gap: 8, alignItems: 'center' },
  windowDropZone: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  windowZoneActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: Radius.md,
    borderColor: '#0288D1',
    backgroundColor: 'rgba(2,136,209,0.22)',
    borderStyle: 'dashed',
  },
  layerButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    fontFamily: Fonts.rounded,
    fontWeight: '700',
    color: '#B2DFDB',
    textAlign: 'center',
    fontSize: FontSizes.sm,
    maxWidth: 130,
  },
  layerButtons: { flexDirection: 'row', gap: 8 },
  layerBtn: {
    backgroundColor: '#E0F2F1',
    borderColor: '#80CBC4',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  layerBtnActive: { backgroundColor: '#FFCDD2', borderColor: '#E53935' },
  layerBtnActive2: { backgroundColor: '#FFF9C4', borderColor: '#F9A825' },
  layerBtnActive3: { backgroundColor: '#B2EBF2', borderColor: '#00838F' },
  layerBtnEmoji: { fontSize: 12 },
  layerBtnText: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    color: '#004D40',
    fontSize: FontSizes.xs,
  },
});
