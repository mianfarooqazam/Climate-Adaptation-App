/**
 * EcoHero: Flood Fighters — Roof Garden Game
 *
 * Same house layout as Windows world (Add the Right Window level).
 * User drags plants onto the roof to create a green roof.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LanguageToggle from '@/components/game/LanguageToggle';
import { getLevelById } from '@/constants/gameData';
import {
  Fonts,
  FontSizes,
  GameColors,
  Radius,
  Spacing,
} from '@/constants/theme';
import type { TranslationKey } from '@/constants/i18n';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

// ---------------------------------------------------------------------------
// Dimensions (match windows-game house)
// ---------------------------------------------------------------------------

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const CTRL_H = 100;
const SCENE_H = SCR_H - HEADER_H - CTRL_H;
const SIDE_D = 50;

const H_W = Math.min((SCR_W - 60 - SIDE_D) * 0.46, 360);
const H_H = Math.min(SCENE_H * 0.6, 320);
const H_LEFT = (SCR_W - H_W - SIDE_D) / 2;
const H_TOP = SCENE_H * 0.26;

const ROOF_H = 70;
const ROOF_OVERHANG = 24;
const WALL_H = H_H - ROOF_H - 14;

// Roof drop zone (in scene coordinates relative to houseWrap)
const ROOF_DROP_LEFT = H_LEFT;
const ROOF_DROP_TOP = H_TOP;
const ROOF_DROP_WIDTH = H_W + ROOF_OVERHANG;
const ROOF_DROP_HEIGHT = ROOF_H;

// ---------------------------------------------------------------------------
// Mood (nice & cool — same as windows 3-layer)
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

function coolMood(tFn: (k: TranslationKey) => string): Mood {
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

// ---------------------------------------------------------------------------
// CartoonPerson (same as windows-game)
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
      <View style={{ width: h(30), height: h(30), borderRadius: h(15), backgroundColor: m.skin, zIndex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', gap: h(8), marginTop: -h(2) }}>
          {m.eyeStyle === 'happy' ? (
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
        <View style={{ flexDirection: 'row', gap: h(14), marginTop: h(1) }}>
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
        </View>
        <View style={{ marginTop: h(1) }}>
          <View style={{ width: h(12), height: h(7), backgroundColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} />
        </View>
      </View>
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
      <View style={{ position: 'absolute', top: h(46), flexDirection: 'row', width: h(52), justifyContent: 'space-between' }}>
        <View style={{ width: h(9), height: h(22), backgroundColor: m.skin, borderRadius: h(4), transform: [{ rotate: '12deg' }] }} />
        <View style={{ width: h(9), height: h(22), backgroundColor: m.skin, borderRadius: h(4), transform: [{ rotate: '-12deg' }] }} />
      </View>
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
      <View style={{ flexDirection: 'row', gap: h(3), marginTop: -h(1) }}>
        <View style={{ width: h(13), height: h(5), backgroundColor: isFemale ? '#AD1457' : '#5D4037', borderRadius: h(3) }} />
        <View style={{ width: h(13), height: h(5), backgroundColor: isFemale ? '#AD1457' : '#5D4037', borderRadius: h(3) }} />
      </View>
    </View>
  );
}

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

// ---------------------------------------------------------------------------
// Plant options (drag any to roof to complete)
// ---------------------------------------------------------------------------

const PLANTS = [
  { id: 'p1', emoji: '\u{1F331}', labelKey: 'plantSeedling' as TranslationKey },
  { id: 'p2', emoji: '\u{1F33F}', labelKey: 'plantHerb' as TranslationKey },
  { id: 'p3', emoji: '\u{1F33B}', labelKey: 'plantSunflower' as TranslationKey },
];

// ============================================================================
// SCREEN
// ============================================================================

export default function RoofGardenGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();
  const { t, lang } = useLanguage();

  const level = getLevelById(levelId ?? 'w8-l1');
  const [plantOnRoof, setPlantOnRoof] = useState(false);
  const [placedPlantEmoji, setPlacedPlantEmoji] = useState<string | null>(null);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneRef = useRef<View>(null);

  useEffect(() => () => {
    if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
  }, []);

  // When 1 plant is dropped, show that one + 3 more on roof (4 total)
  const plantsOnRoofEmojis = placedPlantEmoji
    ? [placedPlantEmoji, ...PLANTS.map((p) => p.emoji).slice(0, 3)]
    : [];

  const moodVal = coolMood(t);

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

  const roofZonePulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(roofZonePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(roofZonePulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const finishLevel = useCallback(() => {
    completeLevel(level?.id ?? 'w8-l1', 30, 30);
    router.replace({
      pathname: '/level-complete',
      params: {
        levelId: level?.id ?? 'w8-l1',
        stars: '3',
        score: '30',
        maxScore: '30',
      },
    });
  }, [completeLevel, level?.id, router]);

  const tryDropOnRoof = useCallback((moveX: number, moveY: number, plantId: string, sceneX?: number, sceneY?: number) => {
    const left = sceneX !== undefined && sceneY !== undefined ? sceneX + ROOF_DROP_LEFT : ROOF_DROP_LEFT;
    const top = sceneX !== undefined && sceneY !== undefined ? sceneY + ROOF_DROP_TOP : ROOF_DROP_TOP;
    if (
      moveX >= left &&
      moveX <= left + ROOF_DROP_WIDTH &&
      moveY >= top &&
      moveY <= top + ROOF_DROP_HEIGHT &&
      !plantOnRoof
    ) {
      const plant = PLANTS.find((p) => p.id === plantId);
      if (plant) {
        setPlacedPlantEmoji(plant.emoji);
        setPlantOnRoof(true);
        if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = setTimeout(() => {
          completeTimeoutRef.current = null;
          finishLevel();
        }, 3000);
      }
    }
  }, [plantOnRoof, finishLevel]);

  const tryDropRef = useRef(tryDropOnRoof);
  useEffect(() => {
    tryDropRef.current = tryDropOnRoof;
  }, [tryDropOnRoof]);

  const runDropWithMeasure = useCallback((moveX: number, moveY: number, plantId: string) => {
    (sceneRef.current as any)?.measureInWindow?.((sx: number, sy: number) => {
      tryDropRef.current(moveX, moveY, plantId, sx, sy);
    });
  }, []);

  const runDropRef = useRef(runDropWithMeasure);
  useEffect(() => {
    runDropRef.current = runDropWithMeasure;
  }, [runDropWithMeasure]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragXY = useRef<Record<string, Animated.ValueXY>>({});
  const scaleVal = useRef<Record<string, Animated.Value>>({});
  PLANTS.forEach((p) => {
    if (!dragXY.current[p.id]) dragXY.current[p.id] = new Animated.ValueXY({ x: 0, y: 0 });
    if (!scaleVal.current[p.id]) scaleVal.current[p.id] = new Animated.Value(1);
  });

  const makePlantPanResponder = useCallback((plantId: string) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderGrant: () => {
        setDraggingId(plantId);
        const d = dragXY.current[plantId];
        const s = scaleVal.current[plantId];
        d.setOffset({ x: (d.x as any)._value ?? 0, y: (d.y as any)._value ?? 0 });
        d.setValue({ x: 0, y: 0 });
        Animated.spring(s, { toValue: 1.2, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => {
        dragXY.current[plantId].setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        setDraggingId(null);
        const d = dragXY.current[plantId];
        const s = scaleVal.current[plantId];
        d.flattenOffset();
        Animated.spring(s, { toValue: 1, useNativeDriver: true }).start();
        runDropRef.current(g.moveX, g.moveY, plantId);
        Animated.spring(d, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    }),
  []);

  const panResponders = useRef(
    PLANTS.reduce((acc, p) => ({ ...acc, [p.id]: makePlantPanResponder(p.id) }), {} as Record<string, ReturnType<typeof PanResponder.create>>)
  ).current;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]}>{t('roofGardenLevelTitle')}</Text>
        <View style={{ flex: 1 }} />
        <LanguageToggle />
      </View>

      <View ref={sceneRef} style={styles.scene} collapsable={false}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

        <Animated.View style={{ transform: [{ translateX: cloudX }] }}>
          <Cloud left={SCR_W * 0.05} top={14} size={52} />
          <Cloud left={SCR_W * 0.28} top={6} size={44} />
          <Cloud left={SCR_W * 0.52} top={20} size={38} />
        </Animated.View>

        <Animated.View style={[styles.sun, { transform: [{ scale: sunScale }] }]}>
          <View style={styles.sunGlow3} />
          <View style={styles.sunGlow2} />
          <View style={styles.sunGlow1} />
          <Text style={styles.sunEmoji}>{'\u2600\uFE0F'}</Text>
        </Animated.View>

        <View style={styles.sunLabel}>
          <Text style={styles.sunLabelText}>{t('sunScorching')}</Text>
        </View>

        {/* ======= 3D HOUSE (same layout as windows world) ======= */}
        <View style={styles.houseWrap}>
          <View style={styles.groundShadow} />

          {/* Right side = brick wall (like house, not window) */}
          <View style={[styles.sideWall, { backgroundColor: '#BCAAA4' }]}>
            {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
              <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 8 }]}>
                {Array.from({ length: 2 }).map((__, j) => (
                  <View key={j} style={styles.brick} />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.chimney}>
            <View style={styles.chimneyTop} />
            <View style={styles.chimneyFront} />
          </View>

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
            {/* Plants on roof: dropped plant + 3 more (4 total) */}
            {plantOnRoof && plantsOnRoofEmojis.length > 0 && (
              <View style={styles.plantsOnRoofWrap} pointerEvents="none">
                {plantsOnRoofEmojis.map((emoji, i) => (
                  <Text key={i} style={styles.plantOnRoofEmoji}>{emoji}</Text>
                ))}
              </View>
            )}
          </View>

          <View style={styles.frontWalls}>
            <View style={styles.wallPanel}>
              {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 12 }]}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <View key={j} style={styles.brick} />
                  ))}
                </View>
              ))}
            </View>

            <View style={[styles.interior, { backgroundColor: moodVal.bg }]}>
              <View style={styles.floorLine} />
              <View style={styles.table}>
                <View style={styles.tableTop} />
                <View style={styles.tableLeg} />
              </View>
              <View style={styles.decoWindowL}>
                <View style={styles.decoWindowPane} />
                <View style={styles.decoWindowCross} />
                <View style={styles.decoWindowCrossH} />
              </View>
              <View style={styles.peopleRow}>
                <CartoonPerson m={moodVal} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
                <CartoonPerson m={moodVal} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
                <CartoonPerson m={moodVal} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
                <CartoonPerson m={moodVal} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
              </View>
              <Text style={[styles.moodLabel, { color: '#1565C0' }]}>{moodVal.label}</Text>
            </View>

            <View style={styles.wallPanelR}>
              {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 10 }]}>
                  <View style={styles.brick} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.doorWrap}>
            <View style={styles.door}>
              <View style={styles.doorInner}>
                <View style={styles.doorKnob} />
              </View>
              <View style={styles.doorArch} />
            </View>
            <View style={styles.doorStep} />
          </View>

          <View style={styles.foundation} />
        </View>

        <View style={styles.ground}>
          <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
        </View>
        <Text style={[styles.tree, { left: H_LEFT - 60, bottom: SCENE_H - H_TOP - H_H + 6 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.tree, { left: H_LEFT + H_W + SIDE_D + 20, bottom: SCENE_H - H_TOP - H_H + 10 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT - 20 }]}>{'\u{1F33F}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT + H_W + SIDE_D + 60 }]}>{'\u{1F33F}'}</Text>

        {/* Roof drop zone highlight */}
        {!plantOnRoof && (
          <View
            pointerEvents="none"
            style={[styles.roofDropZone, { left: ROOF_DROP_LEFT, top: ROOF_DROP_TOP, width: ROOF_DROP_WIDTH, height: ROOF_DROP_HEIGHT }]}
          >
            <Animated.View style={[styles.roofZoneActive, { opacity: roofZonePulse }]} />
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Text style={[styles.helper, lang === 'ur' && styles.rtl]}>{t('dragPlantsToRoof')}</Text>
        <View style={styles.plantButtons}>
          {PLANTS.map((plant) => (
            <Animated.View
              key={plant.id}
              {...panResponders[plant.id].panHandlers}
              style={[
                styles.plantButtonWrap,
                {
                  transform: [
                    ...dragXY.current[plant.id].getTranslateTransform(),
                    { scale: scaleVal.current[plant.id] },
                  ],
                  zIndex: draggingId === plant.id ? 100 : 1,
                },
              ]}
            >
              <View style={styles.plantBtn}>
                <Text style={styles.plantBtnEmoji}>{plant.emoji}</Text>
                <Text style={[styles.plantBtnText, lang === 'ur' && styles.rtl]}>{t(plant.labelKey)}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  root: { flex: 1 },
  rtl: { writingDirection: 'rtl' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(46,125,50,0.92)',
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

  scene: { flex: 1, position: 'relative', overflow: 'hidden' },

  sun: {
    position: 'absolute',
    right: 30,
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
  sunLabel: {
    position: 'absolute',
    right: 26,
    top: 88,
    backgroundColor: 'rgba(255,111,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 11,
  },
  sunLabelText: { fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center' },

  houseWrap: {
    position: 'absolute',
    left: H_LEFT,
    top: H_TOP,
    width: H_W + SIDE_D + 10,
    height: H_H + 30,
    zIndex: 3,
  },
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
  brickRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  brick: {
    width: 22,
    height: 14,
    backgroundColor: '#BCAAA4',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#A1887F',
  },
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
  plantsOnRoofWrap: {
    position: 'absolute',
    top: ROOF_H / 2 - 22,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 4,
  },
  plantOnRoofEmoji: {
    fontSize: 36,
  },
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

  roofDropZone: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  roofZoneActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: Radius.md,
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(46,125,50,0.2)',
    borderStyle: 'dashed',
  },

  controls: {
    minHeight: CTRL_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: 'rgba(46,125,50,0.90)',
  },
  helper: {
    fontFamily: Fonts.rounded,
    fontWeight: '700',
    color: '#C8E6C9',
    textAlign: 'center',
    fontSize: FontSizes.sm,
    maxWidth: 180,
  },
  plantButtons: { flexDirection: 'row', gap: 12 },
  plantButtonWrap: { alignItems: 'center', justifyContent: 'center' },
  plantBtn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  plantBtnEmoji: { fontSize: 28 },
  plantBtnText: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    color: GameColors.primaryDark,
    fontSize: FontSizes.xs,
  },
});
