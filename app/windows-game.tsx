/**
 * EcoHero: Flood Fighters — Windows Game (Landscape Tablet)
 *
 * Compare single, double, and triple-layer windows.
 * More layers block more sun rays and keep people cooler.
 *
 * Uses the same 3D isometric house, CartoonPerson, Cloud, animated sun,
 * gradient rays, thermometer, ground, trees/bushes as the insulation game.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import GameButton from '@/components/game/GameButton';
import Thermometer from '@/components/game/Thermometer';
import LanguageToggle from '@/components/game/LanguageToggle';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLevelById } from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
} from '@/constants/theme';

type WindowLayer = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Responsive dimensions — full-screen landscape
// ---------------------------------------------------------------------------

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const CTRL_H = 100;
const SCENE_H = SCR_H - HEADER_H - CTRL_H;

const THERMO_W = 80;

// 3D depth
const SIDE_D = 50;

// House front-face dimensions
const H_W = Math.min((SCR_W - THERMO_W - 60 - SIDE_D) * 0.46, 360);
const H_H = Math.min(SCENE_H * 0.6, 320);
const H_LEFT = (SCR_W - THERMO_W - H_W - SIDE_D) / 2;
const H_TOP = SCENE_H * 0.26;

const ROOF_H = 70;
const ROOF_OVERHANG = 24;
const WALL_H = H_H - ROOF_H - 14;

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

function moodFromLayer(layer: WindowLayer, tFn: (k: string) => string): Mood {
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
  const [layer, setLayer] = useState<WindowLayer>(1);

  const visibleRays = layer === 1 ? 8 : layer === 2 ? 4 : 1;
  const moodVal = moodFromLayer(layer, t);
  const currentTemp = tempFromLayer(layer);

  const score = useMemo(() => {
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

  const finishLevel = () => {
    const maxScore = 30;
    const stars = completeLevel(level?.id ?? 'w5-l1', score, maxScore);
    router.replace({
      pathname: '/level-complete',
      params: {
        levelId: level?.id ?? 'w5-l1',
        stars: String(stars),
        score: String(score),
        maxScore: String(maxScore),
      },
    });
  };

  // Window glass color for the big side window — changes with layer count
  const windowGlass = layer === 1 ? '#B3E5FC' : layer === 2 ? '#81D4FA' : '#4DD0E1';

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />

      {/* ===== COMPACT HEADER ===== */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={[styles.headerTitle, lang === 'ur' && styles.rtl]}>{t('windowLayers')}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.headerSub, lang === 'ur' && styles.rtl]}>
          {t('raysPassing')}: {visibleRays}/8
        </Text>
        <LanguageToggle />
      </View>

      {/* ===== SCENE ===== */}
      <View style={styles.scene}>
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
              {layer >= 2 && <View style={styles.sideWindowLayer2} />}
              {/* Layer 3 inner pane */}
              {layer >= 3 && <View style={styles.sideWindowLayer3} />}
              {/* Cross bars removed */}
              {/* Layer label */}
              <View style={styles.sideWindowLabelWrap}>
                <Text style={styles.sideWindowLabel}>{layer}x</Text>
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
      </View>

      {/* ===== BOTTOM CONTROLS ===== */}
      <View style={styles.controls}>
        <Text style={[styles.helper, lang === 'ur' && styles.rtl]}>{t('chooseWindow')}</Text>
        <View style={styles.layerButtons}>
          <Pressable
            style={[styles.layerBtn, layer === 1 && styles.layerBtnActive]}
            onPress={() => setLayer(1)}
          >
            <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F'}</Text>
            <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('singleLayer')}</Text>
          </Pressable>
          <Pressable
            style={[styles.layerBtn, layer === 2 && styles.layerBtnActive2]}
            onPress={() => setLayer(2)}
          >
            <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F\uD83E\uDE9F'}</Text>
            <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('doubleLayer')}</Text>
          </Pressable>
          <Pressable
            style={[styles.layerBtn, layer === 3 && styles.layerBtnActive3]}
            onPress={() => setLayer(3)}
          >
            <Text style={styles.layerBtnEmoji}>{'\uD83E\uDE9F\uD83E\uDE9F\uD83E\uDE9F'}</Text>
            <Text style={[styles.layerBtnText, lang === 'ur' && styles.rtl]}>{t('tripleLayer')}</Text>
          </Pressable>
        </View>
        <GameButton
          title={t('completeWindowsLevel')}
          emoji={'\u2705'}
          onPress={finishLevel}
          color={GameColors.primary}
          size="md"
        />
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

  // Bottom controls
  controls: {
    height: CTRL_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: 'rgba(0,77,64,0.90)',
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
