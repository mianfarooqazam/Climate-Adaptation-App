/**
 * EcoHero: Flood Fighters — Roof Garden Game (World 3)
 *
 * Level 1: Learn what a roof garden is — plants on the roof reduce heat (like windows level 1).
 * Level 2: Drag plants onto the roof to shade it and keep everyone cool (like windows level 2).
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
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GameButton from '@/components/game/GameButton';
import LanguageToggle from '@/components/game/LanguageToggle';
import Thermometer from '@/components/game/Thermometer';
import { getLevelById } from '@/constants/gameData';
import { FontSizes, Fonts, GameColors, Spacing } from '@/constants/theme';
import type { TranslationKey } from '@/constants/i18n';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

// ---------------------------------------------------------------------------
// Dimensions (match insulation/windows)
// ---------------------------------------------------------------------------

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const CTRL_H = 100;
const SCENE_H = SCR_H - HEADER_H - CTRL_H;
const THERMO_W = 80;
const SIDE_D = 50;
const SIDE_WALL_W = 70;

const H_W = Math.min((SCR_W - THERMO_W - 60 - SIDE_D) * 0.46, 360);
const H_H = Math.min(SCENE_H * 0.6, 320);
const H_LEFT = (SCR_W - THERMO_W - H_W - SIDE_D) / 2;
const H_TOP = SCENE_H * 0.26;
const ROOF_H = 70;
const ROOF_OVERHANG = 24;
const WALL_H = H_H - ROOF_H - 14;
const SUN_CX = (SCR_W - THERMO_W) * 0.86;
const SUN_CY = 24;

// Roof drop zone (level 2) — scene coordinates
const ROOF_DROP_LEFT = H_LEFT - ROOF_OVERHANG / 2;
const ROOF_DROP_TOP = H_TOP;
const ROOF_DROP_W = H_W + ROOF_OVERHANG + SIDE_D;
const ROOF_DROP_H = ROOF_H + 12;

// ---------------------------------------------------------------------------
// Mood (like windows/insulation)
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

function moodFromPlants(plantCount: number, t: (k: TranslationKey) => string): Mood {
  if (plantCount >= 2) {
    return { label: t('niceCool'), bg: '#BBDEFB', skin: '#FFCCBC', cheek: '#EF9A9A', mouth: 'grin', sweat: false, eyeStyle: 'happy' };
  }
  if (plantCount >= 1) {
    return { label: t('moderate'), bg: '#FFF9C4', skin: '#FFE0B2', cheek: '#FFB74D', mouth: 'neutral', sweat: false, eyeStyle: 'normal' };
  }
  return { label: t('tooHot'), bg: '#FFCDD2', skin: '#FFAB91', cheek: '#EF5350', mouth: 'frown', sweat: true, eyeStyle: 'squint' };
}

function tempFromPlants(plantCount: number): number {
  if (plantCount >= 2) return 22;
  if (plantCount >= 1) return 28;
  return 36;
}

// ---------------------------------------------------------------------------
// CartoonPerson (compact, same as windows)
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
          {hairBow && <View style={{ position: 'absolute', top: h(2), right: h(6), width: h(10), height: h(10), backgroundColor: hairBow, borderRadius: h(5), zIndex: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }} />}
        </>
      ) : (
        <View style={{ width: h(32), height: h(14), backgroundColor: hair, borderTopLeftRadius: h(16), borderTopRightRadius: h(16), marginBottom: -h(4), zIndex: 2 }} />
      )}
      <View style={{ width: h(30), height: h(30), borderRadius: h(15), backgroundColor: m.skin, zIndex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', gap: h(8), marginTop: -h(2) }}>
          {m.eyeStyle === 'squint' ? (<><View style={{ width: h(7), height: h(3), backgroundColor: '#5D4037', borderRadius: h(2) }} /><View style={{ width: h(7), height: h(3), backgroundColor: '#5D4037', borderRadius: h(2) }} /></>) : m.eyeStyle === 'happy' ? (<><View style={{ width: h(7), height: h(4), borderTopWidth: h(2.5), borderColor: '#5D4037', borderTopLeftRadius: h(5), borderTopRightRadius: h(5), backgroundColor: 'transparent' }} /><View style={{ width: h(7), height: h(4), borderTopWidth: h(2.5), borderColor: '#5D4037', borderTopLeftRadius: h(5), borderTopRightRadius: h(5), backgroundColor: 'transparent' }} /></>) : (<><View style={{ width: h(5), height: h(5), borderRadius: h(3), backgroundColor: '#5D4037' }} /><View style={{ width: h(5), height: h(5), borderRadius: h(3), backgroundColor: '#5D4037' }} /></>)}
        </View>
        <View style={{ flexDirection: 'row', gap: h(14), marginTop: h(1) }}>
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
        </View>
        <View style={{ marginTop: h(1) }}>
          {m.mouth === 'frown' ? <View style={{ width: h(10), height: h(5), borderBottomWidth: h(2.5), borderColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6), transform: [{ rotate: '180deg' }] }} /> : m.mouth === 'neutral' ? <View style={{ width: h(8), height: h(2.5), backgroundColor: '#5D4037', borderRadius: h(1) }} /> : m.mouth === 'smile' ? <View style={{ width: h(10), height: h(5), borderBottomWidth: h(2.5), borderColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} /> : <View style={{ width: h(12), height: h(7), backgroundColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} />}
        </View>
        {m.sweat && <View style={{ position: 'absolute', right: -h(2), top: h(6), width: h(6), height: h(9), borderRadius: h(3), backgroundColor: '#64B5F6' }} />}
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

// ---------------------------------------------------------------------------
// Plant types for drag level
// ---------------------------------------------------------------------------

const PLANT_EMOJIS = ['\u{1F331}', '\u{1F33F}', '\u{1F340}']; // 🌱 🌿 🍀

// ============================================================================
// SCREEN
// ============================================================================

export default function RoofGardenGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();
  const { t, lang } = useLanguage();

  const level = getLevelById(levelId ?? 'w3-l1');
  const isLearnLevel = levelId === 'w3-l1';
  const isDragLevel = levelId === 'w3-l2';

  const [plantsOnRoof, setPlantsOnRoof] = useState<number>(0);
  const [finished, setFinished] = useState(false);

  const moodVal = moodFromPlants(plantsOnRoof, t);
  const currentTemp = tempFromPlants(plantsOnRoof);

  const sunScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunScale, { toValue: 1.06, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sunScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const finishLearnLevel = () => {
    completeLevel('w3-l1', 30, 30);
    router.replace({
      pathname: '/level-complete',
      params: { levelId: 'w3-l1', stars: '3', score: '30', maxScore: '30' },
    });
  };

  const sceneRef = useRef<View>(null);
  const tryDropOnRoof = useCallback((moveX: number, moveY: number, sceneX?: number, sceneY?: number) => {
    if (finished || plantsOnRoof >= 2) return;
    if (sceneX === undefined || sceneY === undefined) return;
    const left = sceneX + ROOF_DROP_LEFT;
    const top = sceneY + ROOF_DROP_TOP;
    if (moveX >= left && moveX <= left + ROOF_DROP_W && moveY >= top && moveY <= top + ROOF_DROP_H) {
      setPlantsOnRoof((n) => {
        const next = n + 1;
        if (next >= 2) {
          setFinished(true);
          const stars = completeLevel('w3-l2', 30, 30);
          setTimeout(() => {
            router.replace({
              pathname: '/level-complete',
              params: { levelId: 'w3-l2', stars: String(stars), score: '30', maxScore: '30' },
            });
          }, 2000);
        }
        return next;
      });
    }
  }, [finished, plantsOnRoof, completeLevel]);

  const runDropWithMeasure = useCallback((moveX: number, moveY: number) => {
    (sceneRef.current as any)?.measureInWindow?.((sx: number, sy: number) => {
      tryDropOnRoof(moveX, moveY, sx, sy);
    });
  }, [tryDropOnRoof]);

  const dragPlant = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scalePlant = useRef(new Animated.Value(1)).current;
  const [isDraggingPlant, setIsDraggingPlant] = useState(false);

  const panPlant = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderGrant: () => {
        setIsDraggingPlant(true);
        dragPlant.setOffset({ x: (dragPlant.x as any)._value ?? 0, y: (dragPlant.y as any)._value ?? 0 });
        dragPlant.setValue({ x: 0, y: 0 });
        Animated.spring(scalePlant, { toValue: 1.2, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => dragPlant.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        setIsDraggingPlant(false);
        dragPlant.flattenOffset();
        Animated.spring(scalePlant, { toValue: 1, useNativeDriver: true }).start();
        runDropWithMeasure(g.moveX, g.moveY);
        Animated.spring(dragPlant, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // ----- Learn level: two proper homes side by side (same size as other level, scaled to fit) -----
  if (isLearnLevel) {
    const moodHot = moodFromPlants(0, t);
    const moodCool = moodFromPlants(2, t);
    const learnHouseW = H_W + SIDE_D + 10;
    const learnHouseH = H_H + 30;
    const halfW = (SCR_W - 48) / 2;
    const learnScale = Math.min(1, (halfW - 24) / learnHouseW);
    const wrapW = learnHouseW * learnScale;
    const wrapH = learnHouseH * learnScale;
    const scaleOffsetX = (learnHouseW * (1 - learnScale)) / 2;
    const scaleOffsetY = (learnHouseH * (1 - learnScale)) / 2;
    const renderLearnHouse = (mood: Mood, hasPlants: boolean) => (
      <View style={[styles.learnHouseWrap, { width: wrapW, height: wrapH }]}>
        <View style={[styles.learnHouseScaled, { left: -scaleOffsetX, top: -scaleOffsetY, width: learnHouseW, height: learnHouseH, transform: [{ scale: learnScale }] }]}>
        <View style={styles.learnHouseBlock}>
            <View style={[styles.groundShadow, { left: 10, top: H_H + 4, width: H_W + SIDE_D - 10, height: 18 }]} />
            <View style={[styles.sideWall, { left: H_W, top: ROOF_H, width: SIDE_WALL_W, height: WALL_H }]}>
              {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 12 }]}>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <View key={j} style={styles.brick} />
                  ))}
                </View>
              ))}
            </View>
            <View style={[styles.chimney, { left: H_W * 0.17, top: -28 }]}>
              <View style={styles.chimneyTop} />
              <View style={styles.chimneyFront} />
            </View>
            <View style={[styles.frontRoof, { left: -ROOF_OVERHANG / 2, top: 0, width: H_W + ROOF_OVERHANG, height: ROOF_H }]}>
              <View style={[styles.roofTriangle, { borderLeftWidth: (H_W + ROOF_OVERHANG) / 2, borderRightWidth: (H_W + ROOF_OVERHANG) / 2, borderBottomWidth: ROOF_H }]} />
              <View style={[styles.roofRidge, { width: H_W * 0.08 }]} />
              {hasPlants && (
                <>
                  <View style={[styles.roofPlantPos1, { top: ROOF_H / 2 - 10 }]}>
                    <Text style={styles.roofPlantEmoji}>{'\u{1F331}'}</Text>
                  </View>
                  <View style={[styles.roofPlantPos2, { top: ROOF_H / 2 - 10 }]}>
                    <Text style={styles.roofPlantEmoji}>{'\u{1F33F}'}</Text>
                  </View>
                </>
              )}
            </View>
            <View style={[styles.frontWalls, { left: 0, top: ROOF_H, width: H_W, height: WALL_H }]}>
              <View style={styles.wallPanel}>
                {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                  <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 12 }]}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <View key={j} style={styles.brick} />
                    ))}
                  </View>
                ))}
              </View>
              <View style={[styles.interior, { backgroundColor: mood.bg }]}>
                <View style={styles.floorLine} />
                <View style={styles.decoWindowL}>
                  <View style={styles.windowPane} />
                  <View style={styles.windowCross} />
                  <View style={styles.windowCrossH} />
                </View>
                <View style={styles.peopleRow}>
                  <CartoonPerson m={mood} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
                  <CartoonPerson m={mood} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
                  <CartoonPerson m={mood} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
                  <CartoonPerson m={mood} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
                </View>
                <Text style={[styles.moodLabel, { color: mood.bg === '#BBDEFB' ? '#1565C0' : mood.bg === '#FFCDD2' ? '#C62828' : '#E65100' }]}>{mood.label}</Text>
              </View>
              <View style={styles.wallPanelR}>
                {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                  <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 10 }]}>
                    <View style={styles.brick} />
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.doorWrap, { left: H_W / 2 - 22, top: H_H - 72 }]}>
              <View style={styles.door}>
                <View style={styles.doorInner}>
                  <View style={styles.doorKnob} />
                </View>
                <View style={styles.doorArch} />
              </View>
              <View style={styles.doorStep} />
            </View>
            <View style={[styles.foundation, { left: 0, top: H_H - 14, width: H_W, height: 10 }]} />
          </View>
        </View>
      </View>
    );
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>{'\u2190'}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]}>{t('roofGardenLearnTitle')}</Text>
          <View style={{ flex: 1 }} />
          <LanguageToggle />
        </View>
        <ScrollView style={styles.learnScroll} contentContainerStyle={styles.learnSectionsWrap} showsVerticalScrollIndicator={false} horizontal={false}>
          <View style={styles.learnRow}>
            <View style={styles.learnSectionSide}>
              <Text style={[styles.learnSectionText, lang === 'ur' && styles.rtl]}>{t('roofGardenSection1')}</Text>
              {renderLearnHouse(moodHot, false)}
            </View>
            <View style={styles.learnSectionSide}>
              <Text style={[styles.learnSectionText, lang === 'ur' && styles.rtl]}>{t('roofGardenSection2')}</Text>
              {renderLearnHouse(moodCool, true)}
            </View>
          </View>
        </ScrollView>
        <Pressable style={styles.learnContinueWrap} onPress={finishLearnLevel}>
          <Text style={[styles.learnContinueText, lang === 'ur' && styles.rtl]}>{t('continueBtn')}</Text>
          <Text style={styles.learnContinueArrow}>{'\u27A1'}</Text>
        </Pressable>
      </View>
    );
  }

  // ----- Drag level: house with roof drop zone, tray of plants -----
  const roofRays = plantsOnRoof >= 2 ? 0 : plantsOnRoof >= 1 ? 2 : 4;
  const rayEnds = [
    { id: 'r1', endX: H_LEFT + H_W * 0.2, endY: H_TOP + 10 },
    { id: 'r2', endX: H_LEFT + H_W * 0.45, endY: H_TOP + 14 },
    { id: 'r3', endX: H_LEFT + H_W * 0.7, endY: H_TOP + 18 },
    { id: 'r4', endX: H_LEFT + H_W * 0.5, endY: H_TOP + 30 },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]}>{t('roofGardenAddPlantsTitle')}</Text>
        <View style={{ flex: 1 }} />
        <LanguageToggle />
      </View>

      <View ref={sceneRef} style={styles.scene} collapsable={false}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

        {/* Sun (same as windows/insulation) */}
        <Animated.View style={[styles.sun, { transform: [{ scale: sunScale }] }]}>
          <View style={styles.sunGlow3} />
          <View style={styles.sunGlow2} />
          <View style={styles.sunGlow1} />
          <Text style={styles.sunEmoji}>{'\u2600\uFE0F'}</Text>
        </Animated.View>
        <View style={styles.sunLabel}>
          <Text style={styles.sunLabelText}>{t('sunScorching')}</Text>
        </View>

        {rayEnds.slice(0, roofRays).map((r) => {
          const angle = Math.atan2(r.endY - (SUN_CY + 24), r.endX - SUN_CX) * (180 / Math.PI);
          const len = Math.sqrt((r.endX - SUN_CX) ** 2 + (r.endY - (SUN_CY + 24)) ** 2);
          return (
            <View key={r.id} style={[styles.ray, { left: SUN_CX, top: SUN_CY + 20, width: len, transform: [{ rotate: `${angle}deg` }] }]}>
              <LinearGradient colors={['rgba(255,210,0,0.75)', 'rgba(255,165,0,0.3)', 'rgba(255,120,0,0.06)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </View>
          );
        })}

        {/* House (same as windows/insulation) */}
        <View style={[styles.houseWrap, { left: H_LEFT, top: H_TOP }]}>
          <View style={[styles.groundShadow, { left: 10, top: H_H + 4, width: H_W + SIDE_D - 10, height: 18 }]} />
          <View style={[styles.sideWall, { left: H_W, top: ROOF_H, width: SIDE_WALL_W, height: WALL_H }]}>
            {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
              <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 12 }]}>
                {Array.from({ length: 3 }).map((__, j) => (
                  <View key={j} style={styles.brick} />
                ))}
              </View>
            ))}
          </View>
          <View style={[styles.chimney, { left: H_W * 0.17, top: -28 }]}>
            <View style={styles.chimneyTop} />
            <View style={styles.chimneyFront} />
          </View>
          <View style={[styles.frontRoof, { left: -ROOF_OVERHANG / 2, top: 0, width: H_W + ROOF_OVERHANG, height: ROOF_H }]}>
            <View style={[styles.roofTriangle, { borderLeftWidth: (H_W + ROOF_OVERHANG) / 2, borderRightWidth: (H_W + ROOF_OVERHANG) / 2, borderBottomWidth: ROOF_H }]} />
            <View style={[styles.roofRidge, { width: H_W * 0.08 }]} />
            {[0.3, 0.55, 0.8].map((pct, i) => (
              <View key={i} style={{ position: 'absolute', top: ROOF_H * pct, left: ROOF_OVERHANG / 2 + H_W * (0.5 - pct * 0.48), right: ROOF_OVERHANG / 2 + H_W * (0.5 - pct * 0.48), height: 2, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 1 }} />
            ))}
            <View style={styles.roofShadow} />
            {plantsOnRoof >= 1 && (
              <View style={styles.roofPlantPos1}>
                <Text style={styles.roofPlantEmoji}>{PLANT_EMOJIS[0]}</Text>
              </View>
            )}
            {plantsOnRoof >= 2 && (
              <View style={styles.roofPlantPos2}>
                <Text style={styles.roofPlantEmoji}>{PLANT_EMOJIS[1]}</Text>
              </View>
            )}
          </View>
          <View style={[styles.frontWalls, { left: 0, top: ROOF_H, width: H_W, height: WALL_H }]}>
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
              <View style={styles.peopleRow}>
                <CartoonPerson m={moodVal} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
                <CartoonPerson m={moodVal} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
                <CartoonPerson m={moodVal} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
                <CartoonPerson m={moodVal} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
              </View>
              <Text style={[styles.moodLabel, { color: moodVal.bg === '#BBDEFB' ? '#1565C0' : moodVal.bg === '#FFCDD2' ? '#C62828' : '#E65100' }]}>{moodVal.label}</Text>
              {currentTemp >= 32 && (
                <View style={styles.heatWavesRow}>
                  {[0, 1, 2].map((i) => <View key={i} style={styles.heatWaveLine} />)}
                </View>
              )}
              <View style={styles.decoWindowL}>
                <View style={styles.windowPane} />
                <View style={styles.windowCross} />
                <View style={styles.windowCrossH} />
              </View>
            </View>
            <View style={styles.wallPanelR}>
              {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 10 }]}>
                  <View style={styles.brick} />
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.doorWrap, { left: H_W / 2 - 22, top: H_H - 72 }]}>
            <View style={styles.door}>
              <View style={styles.doorInner}>
                <View style={styles.doorKnob} />
              </View>
              <View style={styles.doorArch} />
            </View>
            <View style={styles.doorStep} />
          </View>
          <View style={[styles.foundation, { left: 0, top: H_H - 14, width: H_W, height: 10 }]} />
        </View>

        <View style={styles.ground}>
          <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
        </View>
        <Text style={[styles.tree, { left: H_LEFT - 60, bottom: SCENE_H - H_TOP - H_H + 6 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.tree, { left: H_LEFT + H_W + SIDE_D + 20, bottom: SCENE_H - H_TOP - H_H + 10 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT - 20 }]}>{'\u{1F33F}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT + H_W + SIDE_D + 60 }]}>{'\u{1F33F}'}</Text>

        <View style={styles.thermoPos}>
          <Thermometer temperature={currentTemp} />
        </View>

        {!finished && plantsOnRoof < 2 && (
          <View pointerEvents="none" style={[styles.roofDropHint, { left: ROOF_DROP_LEFT, top: ROOF_DROP_TOP, width: ROOF_DROP_W, height: ROOF_DROP_H }]}>
            <Text style={styles.roofDropHintText}>{t('roofGardenDropHere')}</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Text style={[styles.helper, lang === 'ur' && styles.rtl]}>{t('roofGardenDragHint')}</Text>
        {!finished && plantsOnRoof < 2 && (
          <Animated.View
            {...panPlant.panHandlers}
            style={[styles.plantDragWrap, { transform: [...dragPlant.getTranslateTransform(), { scale: scalePlant }], zIndex: isDraggingPlant ? 100 : 10 }]}
          >
            <View style={styles.plantBtn}>
              <Text style={styles.plantBtnEmoji}>{PLANT_EMOJIS[0]}</Text>
              <Text style={[styles.plantBtnText, lang === 'ur' && styles.rtl]}>{t('roofGardenDropHere')}</Text>
            </View>
          </Animated.View>
        )}
        {finished && <Text style={styles.helper}>{t('niceCool')}</Text>}
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
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerTitle: { fontFamily: Fonts.rounded, fontSize: FontSizes.lg, fontWeight: '900', color: '#fff' },

  learnScroll: { flex: 1 },
  learnSectionsWrap: { paddingVertical: Spacing.md, paddingBottom: 100, flexGrow: 1 },
  learnRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingHorizontal: Spacing.sm },
  learnSectionSide: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xs },
  learnSectionText: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '800', color: GameColors.textSecondary, textAlign: 'center', marginBottom: 14, minHeight: 40 },
  learnHouseWrap: { overflow: 'hidden', alignSelf: 'center' },
  learnHouseScaled: { position: 'absolute' },
  learnHouseBlock: { width: H_W + SIDE_D + 10, height: H_H + 30, position: 'relative' },
  learnContinueWrap: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, backgroundColor: '#66BB6A', borderRadius: 12, gap: 8 },
  learnContinueText: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, fontWeight: '800', color: '#fff' },
  learnContinueArrow: { fontSize: 20, color: '#fff', fontWeight: '700' },

  scene: { flex: 1, position: 'relative', overflow: 'hidden' },
  sun: { position: 'absolute', right: THERMO_W + 20, top: 4, width: 80, height: 80, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  sunGlow3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,235,59,0.12)' },
  sunGlow2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,235,59,0.2)' },
  sunGlow1: { position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255,235,59,0.35)' },
  sunEmoji: { fontSize: 58 },
  sunLabel: { position: 'absolute', right: THERMO_W + 16, top: 88, backgroundColor: 'rgba(255,111,0,0.85)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, zIndex: 11 },
  sunLabelText: { fontSize: 16, fontWeight: '800', color: '#fff', writingDirection: 'rtl', textAlign: 'center' },
  ray: { position: 'absolute', height: 9, borderRadius: 5, overflow: 'hidden', transformOrigin: 'left center', zIndex: 5 },

  houseWrap: { position: 'absolute', width: H_W + SIDE_D + 10, height: H_H + 30, zIndex: 3 },
  groundShadow: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 100, zIndex: 0 },
  sideWall: { position: 'absolute', backgroundColor: '#D7CCC8', transform: [{ skewY: '-6deg' }], overflow: 'hidden', zIndex: 1, borderRightWidth: 2, borderBottomWidth: 1, borderColor: '#8D6E63' },
  chimney: { position: 'absolute', zIndex: 5 },
  chimneyTop: { width: 32, height: 8, backgroundColor: '#5D4037', borderRadius: 3, zIndex: 2 },
  chimneyFront: { width: 24, height: 34, backgroundColor: '#795548', borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginLeft: 4 },
  frontRoof: { position: 'absolute', alignItems: 'center', zIndex: 2 },
  roofTriangle: { width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#8D6E63', borderStyle: 'solid' },
  roofRidge: { height: 6, backgroundColor: '#6D4C41', borderRadius: 3, marginTop: -ROOF_H - 3 },
  roofShadow: { position: 'absolute', bottom: -4, left: ROOF_OVERHANG / 2, right: ROOF_OVERHANG / 2, height: 4, backgroundColor: 'rgba(0,0,0,0.08)' },
  roofPlantPos1: { position: 'absolute', top: ROOF_H / 2 - 12, left: H_W * 0.25 - 14, zIndex: 3 },
  roofPlantPos2: { position: 'absolute', top: ROOF_H / 2 - 12, right: H_W * 0.25 - 14, zIndex: 3 },
  roofPlantEmoji: { fontSize: 28 },
  frontWalls: { position: 'absolute', flexDirection: 'row', overflow: 'hidden', borderBottomLeftRadius: 3, zIndex: 2 },
  wallPanel: { width: 28, backgroundColor: '#D7CCC8', overflow: 'hidden' },
  wallPanelR: { width: 16, backgroundColor: '#D7CCC8', overflow: 'hidden' },
  brickRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  brick: { width: 22, height: 14, backgroundColor: '#BCAAA4', borderRadius: 2, borderWidth: 1, borderColor: '#A1887F' },
  interior: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' },
  floorLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#8D6E63' },
  table: { position: 'absolute', bottom: 8, right: 20, alignItems: 'center' },
  tableTop: { width: 36, height: 6, backgroundColor: '#8D6E63', borderRadius: 2 },
  tableLeg: { width: 4, height: 18, backgroundColor: '#6D4C41' },
  decoWindowL: { position: 'absolute', left: 14, top: 18, width: 42, height: 42, backgroundColor: '#B3E5FC', borderRadius: 4, borderWidth: 3, borderColor: '#8D6E63', overflow: 'hidden' },
  windowPane: { ...StyleSheet.absoluteFillObject, backgroundColor: '#B3E5FC' },
  windowCross: { position: 'absolute', left: '48%', top: 0, bottom: 0, width: 3, backgroundColor: '#8D6E63' },
  windowCrossH: { position: 'absolute', top: '48%', left: 0, right: 0, height: 3, backgroundColor: '#8D6E63' },
  peopleRow: { flexDirection: 'row', gap: 6, zIndex: 2, alignItems: 'flex-end', justifyContent: 'center' },
  moodLabel: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, fontWeight: '800', zIndex: 2, marginTop: 2 },
  heatWavesRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  heatWaveLine: { width: 3, height: 14, backgroundColor: '#FF7043', borderRadius: 2, opacity: 0.6, transform: [{ rotate: '8deg' }] },
  doorWrap: { position: 'absolute', alignItems: 'center', zIndex: 3 },
  door: { width: 40, height: 58, backgroundColor: '#5D4037', borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, overflow: 'hidden' },
  doorInner: { width: 32, height: 44, backgroundColor: '#4E342E', borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 },
  doorKnob: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD54F' },
  doorArch: { position: 'absolute', top: 0, left: 2, right: 2, height: 22, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  doorStep: { width: 52, height: 8, backgroundColor: '#78909C', borderRadius: 2, marginTop: 1, borderBottomWidth: 3, borderBottomColor: '#546E7A', borderRightWidth: 3, borderRightColor: '#607D8B' },
  foundation: { position: 'absolute', backgroundColor: '#78909C', borderRadius: 2, zIndex: 2 },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCENE_H * 0.16, zIndex: 2 },
  tree: { position: 'absolute', fontSize: 48, zIndex: 3 },
  bush: { position: 'absolute', bottom: 4, fontSize: 26, zIndex: 3 },

  thermoPos: { position: 'absolute', right: 0, top: 4, zIndex: 15 },
  roofDropHint: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(46,125,50,0.6)', borderRadius: 8, zIndex: 4, alignItems: 'center', justifyContent: 'center' },
  roofDropHintText: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '700', color: '#2E7D32', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  controls: { height: CTRL_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md, gap: Spacing.lg, backgroundColor: 'rgba(46,125,50,0.15)' },
  helper: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '700', color: GameColors.textSecondary },
  plantDragWrap: { alignItems: 'center', justifyContent: 'center' },
  plantBtn: { backgroundColor: '#A5D6A7', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#2E7D32' },
  plantBtnEmoji: { fontSize: 36, marginBottom: 4 },
  plantBtnText: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '800', color: '#1B5E20' },
});
