/**
 * EcoHero: Flood Fighters — Insulation Game (Landscape Tablet)
 *
 * Full-screen scene with a 3D isometric house. Drag the insulation brick
 * from the tray onto glowing zones (roof / right wall) to block rays.
 * Thermometer on the right. No side panels.
 *
 * The house is drawn in isometric 3D using manually positioned Views
 * with skewY transforms to create visible depth on the right side.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GameButton from '@/components/game/GameButton';
import Thermometer from '@/components/game/Thermometer';
import LanguageToggle from '@/components/game/LanguageToggle';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getLevelById,
  getWorldById,
  INSULATION_MATERIALS,
  INSULATION_LEVEL_CONFIGS,
  type InsulationZoneId,
  type InsulationMaterial,
} from '@/constants/gameData';
import {
  GameColors,
  Spacing,
  FontSizes,
  Fonts,
  Radius,
  Shadow,
} from '@/constants/theme';

// ---------------------------------------------------------------------------
// Responsive dimensions — full-screen landscape
// ---------------------------------------------------------------------------

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const TRAY_H = 90;
const SCENE_W = SCR_W;
const SCENE_H = SCR_H - HEADER_H - TRAY_H;

const THERMO_W = 80;

// 3D depth
const SIDE_D = 50;

// House front-face dimensions
const H_W = Math.min((SCENE_W - THERMO_W - 60 - SIDE_D) * 0.46, 360);
const H_H = Math.min(SCENE_H * 0.6, 320);
const H_LEFT = (SCENE_W - THERMO_W - H_W - SIDE_D) / 2;
const H_TOP = SCENE_H * 0.26;

const ROOF_H = 70;
const ROOF_OVERHANG = 24;
const WALL_H = H_H - ROOF_H - 14;

// Sun
const SUN_CX = (SCENE_W - THERMO_W) * 0.86;
const SUN_CY = 24;

// ---------------------------------------------------------------------------
// Ray geometry helpers
// ---------------------------------------------------------------------------

interface RayDef { id: string; zone: InsulationZoneId; startX: number; startY: number; endX: number; endY: number; }

function rayAngle(r: RayDef) { return Math.atan2(r.endY - r.startY, r.endX - r.startX) * (180 / Math.PI); }
function rayLength(r: RayDef) { return Math.sqrt((r.endX - r.startX) ** 2 + (r.endY - r.startY) ** 2); }

// Rays: roof rays hit the front roof, wall rays hit the 3D side wall
const RAYS: RayDef[] = [
  { id: 'r1', zone: 'roof', startX: SUN_CX - 6,  startY: SUN_CY + 18, endX: H_LEFT + H_W * 0.12, endY: H_TOP },
  { id: 'r2', zone: 'roof', startX: SUN_CX,       startY: SUN_CY + 22, endX: H_LEFT + H_W * 0.32, endY: H_TOP + 6 },
  { id: 'r3', zone: 'roof', startX: SUN_CX + 5,   startY: SUN_CY + 26, endX: H_LEFT + H_W * 0.55, endY: H_TOP + 10 },
  { id: 'r4', zone: 'roof', startX: SUN_CX + 8,   startY: SUN_CY + 30, endX: H_LEFT + H_W * 0.78, endY: H_TOP + 18 },
  // Wall rays hit the right side (3D face)
  { id: 'w1', zone: 'right-wall', startX: SUN_CX - 4, startY: SUN_CY + 34, endX: H_LEFT + H_W + SIDE_D * 0.6, endY: H_TOP + ROOF_H + 20 },
  { id: 'w2', zone: 'right-wall', startX: SUN_CX,     startY: SUN_CY + 38, endX: H_LEFT + H_W + SIDE_D * 0.7, endY: H_TOP + ROOF_H + 70 },
  { id: 'w3', zone: 'right-wall', startX: SUN_CX + 4, startY: SUN_CY + 42, endX: H_LEFT + H_W + SIDE_D * 0.8, endY: H_TOP + ROOF_H + 120 },
  { id: 'w4', zone: 'right-wall', startX: SUN_CX + 8, startY: SUN_CY + 46, endX: H_LEFT + H_W + SIDE_D * 0.6, endY: H_TOP + H_H - 30 },
];

// ---------------------------------------------------------------------------
// Zone hit-boxes (relative to scene)
// ---------------------------------------------------------------------------

interface ZoneVis { id: InsulationZoneId; label: string; left: number; top: number; width: number; height: number; }

const ZONES: ZoneVis[] = [
  // Roof zone covers the front triangle + side roof face
  { id: 'roof', label: 'Roof', left: H_LEFT - ROOF_OVERHANG / 2, top: H_TOP - 6, width: H_W + ROOF_OVERHANG + SIDE_D, height: ROOF_H + 12 },
  // Right-wall zone covers the 3D side wall (wider for better text display)
  { id: 'right-wall', label: 'Right Wall', left: H_LEFT + H_W - 14, top: H_TOP + ROOF_H - 4, width: SIDE_D + 30, height: WALL_H + 8 },
];

// ---------------------------------------------------------------------------
// People mood
// ---------------------------------------------------------------------------

interface Mood { label: string; bg: string; skin: string; cheek: string; mouth: 'frown' | 'neutral' | 'smile' | 'grin'; sweat: boolean; eyeStyle: 'squint' | 'normal' | 'happy'; }

function moodData(temp: number, allInsulated: boolean): Omit<Mood, 'label'> & { labelKey: 'tooHot' | 'veryWarm' | 'warm' | 'comfortable' | 'niceCool' } {
  // When all insulation is applied — always happy
  if (allInsulated) return { labelKey: 'niceCool', bg: '#BBDEFB', skin: '#FFCCBC', cheek: '#EF9A9A', mouth: 'grin', sweat: false, eyeStyle: 'happy' };
  // No insulation yet or partially done — sad/uncomfortable
  if (temp >= 35) return { labelKey: 'tooHot', bg: '#FFCDD2', skin: '#FFAB91', cheek: '#EF5350', mouth: 'frown', sweat: true, eyeStyle: 'squint' };
  if (temp >= 30) return { labelKey: 'veryWarm', bg: '#FFE0B2', skin: '#FFCC80', cheek: '#FF7043', mouth: 'frown', sweat: true, eyeStyle: 'squint' };
  if (temp >= 26) return { labelKey: 'warm', bg: '#FFF9C4', skin: '#FFE0B2', cheek: '#FFB74D', mouth: 'neutral', sweat: false, eyeStyle: 'normal' };
  if (temp >= 22) return { labelKey: 'comfortable', bg: '#C8E6C9', skin: '#FFCCBC', cheek: '#EF9A9A', mouth: 'smile', sweat: false, eyeStyle: 'normal' };
  return { labelKey: 'niceCool', bg: '#BBDEFB', skin: '#FFCCBC', cheek: '#EF9A9A', mouth: 'grin', sweat: false, eyeStyle: 'happy' };
}

// ---------------------------------------------------------------------------
// Cartoon person (drawn with Views)
// ---------------------------------------------------------------------------

interface PersonProps { m: Mood; shirt: string; pants: string; hair: string; isChild?: boolean; isFemale?: boolean; hairBow?: string; }

function CartoonPerson({ m, shirt, pants, hair, isChild, isFemale, hairBow }: PersonProps) {
  const s = isChild ? 0.72 : 1;
  const h = (v: number) => v * s;
  return (
    <View style={{ alignItems: 'center', width: h(52), height: h(110) }}>
      {/* Hair */}
      {isFemale ? (
        <>
          {/* Longer hair for females */}
          <View style={{ width: h(34), height: h(18), backgroundColor: hair, borderTopLeftRadius: h(17), borderTopRightRadius: h(17), marginBottom: -h(6), zIndex: 2 }} />
          {/* Side hair strands */}
          <View style={{ position: 'absolute', top: h(12), left: h(4), width: h(8), height: h(28), backgroundColor: hair, borderBottomLeftRadius: h(6), zIndex: 0 }} />
          <View style={{ position: 'absolute', top: h(12), right: h(4), width: h(8), height: h(28), backgroundColor: hair, borderBottomRightRadius: h(6), zIndex: 0 }} />
          {/* Hair bow for girls */}
          {hairBow && <View style={{ position: 'absolute', top: h(2), right: h(6), width: h(10), height: h(10), backgroundColor: hairBow, borderRadius: h(5), zIndex: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }} />}
        </>
      ) : (
        <View style={{ width: h(32), height: h(14), backgroundColor: hair, borderTopLeftRadius: h(16), borderTopRightRadius: h(16), marginBottom: -h(4), zIndex: 2 }} />
      )}
      {/* Head */}
      <View style={{ width: h(30), height: h(30), borderRadius: h(15), backgroundColor: m.skin, zIndex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Eyes */}
        <View style={{ flexDirection: 'row', gap: h(8), marginTop: -h(2) }}>
          {m.eyeStyle === 'squint' ? (<><View style={{ width: h(7), height: h(3), backgroundColor: '#5D4037', borderRadius: h(2) }} /><View style={{ width: h(7), height: h(3), backgroundColor: '#5D4037', borderRadius: h(2) }} /></>) : m.eyeStyle === 'happy' ? (<><View style={{ width: h(7), height: h(4), borderTopWidth: h(2.5), borderColor: '#5D4037', borderTopLeftRadius: h(5), borderTopRightRadius: h(5), backgroundColor: 'transparent' }} /><View style={{ width: h(7), height: h(4), borderTopWidth: h(2.5), borderColor: '#5D4037', borderTopLeftRadius: h(5), borderTopRightRadius: h(5), backgroundColor: 'transparent' }} /></>) : (<><View style={{ width: h(5), height: h(5), borderRadius: h(3), backgroundColor: '#5D4037' }} /><View style={{ width: h(5), height: h(5), borderRadius: h(3), backgroundColor: '#5D4037' }} /></>)}
        </View>
        {/* Cheeks */}
        <View style={{ flexDirection: 'row', gap: h(14), marginTop: h(1) }}>
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
        </View>
        {/* Mouth */}
        <View style={{ marginTop: h(1) }}>
          {m.mouth === 'frown' ? <View style={{ width: h(10), height: h(5), borderBottomWidth: h(2.5), borderColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6), transform: [{ rotate: '180deg' }] }} /> : m.mouth === 'neutral' ? <View style={{ width: h(8), height: h(2.5), backgroundColor: '#5D4037', borderRadius: h(1) }} /> : m.mouth === 'smile' ? <View style={{ width: h(10), height: h(5), borderBottomWidth: h(2.5), borderColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} /> : <View style={{ width: h(12), height: h(7), backgroundColor: '#5D4037', borderBottomLeftRadius: h(6), borderBottomRightRadius: h(6) }} />}
        </View>
        {/* Sweat */}
        {m.sweat && <View style={{ position: 'absolute', right: -h(2), top: h(6), width: h(6), height: h(9), borderRadius: h(3), backgroundColor: '#64B5F6' }} />}
      </View>
      {/* Body */}
      {isFemale ? (
        <>
          {/* Top */}
          <View style={{ width: h(26), height: h(18), backgroundColor: shirt, borderTopLeftRadius: h(4), borderTopRightRadius: h(4), marginTop: h(1), alignItems: 'center' }}>
            <View style={{ width: h(2), height: h(14), backgroundColor: 'rgba(0,0,0,0.08)', marginTop: h(2) }} />
          </View>
          {/* Skirt */}
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
// Cloud
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

export default function InsulationGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();

  const { t } = useLanguage();
  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const config = INSULATION_LEVEL_CONFIGS[levelId ?? ''];
  const availableMaterials = useMemo(
    () => config ? INSULATION_MATERIALS.filter((mat) => config.availableMaterials.includes(mat.id)) : [],
    [config],
  );

  // State
  const [selectedMaterial] = useState<InsulationMaterial | null>(
    () => availableMaterials.length === 1 ? availableMaterials[0] : null,
  );
  const [insulatedZones, setInsulatedZones] = useState<Record<string, InsulationMaterial>>({});
  const [finished, setFinished] = useState(false);

  const startTemp = config?.startTemp ?? 38;
  const currentTemp = useMemo(() => {
    const cool = Object.values(insulatedZones).reduce((sum, mat) => sum + mat.tempEffect, 0);
    return Math.max(startTemp - cool, 12);
  }, [insulatedZones, startTemp]);

  const allDone = config ? config.activeZones.every((z) => insulatedZones[z]) : false;
  const moodRaw = moodData(currentTemp, allDone);
  const moodVal: Mood = { ...moodRaw, label: t(moodRaw.labelKey) };
  const activeSet = useMemo(() => new Set(config?.activeZones ?? []), [config]);

  // ---- Animations ----
  const sunScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sunScale, { toValue: 1.06, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(sunScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  const rayOpacities = useRef<Record<string, Animated.Value>>({
    roof: new Animated.Value(1),
    'right-wall': new Animated.Value(1),
  }).current;

  const zonePulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(zonePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(zonePulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  const shieldFlash = useRef(new Animated.Value(0)).current;

  const cloudX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(cloudX, { toValue: 18, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(cloudX, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  // ---- Drag & drop (one draggable per active zone) ----
  // Each zone gets its own Animated position, scale, dragging state, and PanResponder.
  const dragRoof = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragRoofScale = useRef(new Animated.Value(1)).current;
  const [isDraggingRoof, setIsDraggingRoof] = useState(false);

  const dragWall = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragWallScale = useRef(new Animated.Value(1)).current;
  const [isDraggingWall, setIsDraggingWall] = useState(false);

  // Use a ref to always hold the latest insulatedZones so PanResponder closures aren't stale
  const insulatedZonesRef = useRef(insulatedZones);
  useEffect(() => { insulatedZonesRef.current = insulatedZones; }, [insulatedZones]);

  const applyInsulation = useCallback((zoneId: InsulationZoneId) => {
    const currentZones = insulatedZonesRef.current;
    if (!selectedMaterial || currentZones[zoneId] || finished) return;
    if (!selectedMaterial.applicableTo.includes(zoneId)) return;

    const newZones = { ...currentZones, [zoneId]: selectedMaterial };
    setInsulatedZones(newZones);
    insulatedZonesRef.current = newZones;
    Animated.timing(rayOpacities[zoneId], { toValue: 0, duration: 700, useNativeDriver: true }).start();
    shieldFlash.setValue(1);
    Animated.timing(shieldFlash, { toValue: 0, duration: 900, useNativeDriver: true }).start();

    const allNowDone = config ? config.activeZones.every((z) => newZones[z]) : false;
    if (allNowDone) {
      setTimeout(() => {
        const cool = Object.values(newZones).reduce((s, mat) => s + mat.tempEffect, 0);
        const temp = Math.max(startTemp - cool, 12);
        const pts = Object.values(newZones).reduce((s, mat) => s + mat.points, 0);
        const maxPts = config ? config.activeZones.reduce((s, z) => {
          const best = availableMaterials.filter((mat) => mat.applicableTo.includes(z)).reduce((mx, mat) => Math.max(mx, mat.points), 0);
          return s + best;
        }, 0) : 1;
        const bonus = temp <= (config?.targetTemp ?? 24) ? Math.round(maxPts * 0.3) : 0;
        const sc = pts + bonus;
        const maxSc = Math.round(maxPts * 1.3);
        const st = completeLevel(levelId ?? '', sc, maxSc);
        router.replace({ pathname: '/level-complete', params: { levelId: levelId ?? '', stars: String(st), score: String(sc), maxScore: String(maxSc) } });
      }, 2000);
    }
  }, [selectedMaterial, finished, config, startTemp, availableMaterials, levelId]);

  // Keep a ref to the latest applyInsulation so PanResponders always call the current version
  const applyRef = useRef(applyInsulation);
  useEffect(() => { applyRef.current = applyInsulation; }, [applyInsulation]);

  const sceneRef = useRef<View>(null);

  // Helper: try to drop on a specific target zone (uses measured scene position for accurate hit test)
  const tryDrop = useCallback((targetZoneId: InsulationZoneId, dropX: number, dropY: number, sceneX?: number, sceneY?: number) => {
    const zone = ZONES.find((z) => z.id === targetZoneId);
    if (!zone || !activeSet.has(zone.id) || insulatedZonesRef.current[zone.id]) return;
    const left = (sceneX ?? 0) + zone.left;
    const top = (sceneY ?? HEADER_H) + zone.top;
    if (dropX >= left && dropX <= left + zone.width && dropY >= top && dropY <= top + zone.height) {
      applyRef.current(zone.id);
    }
  }, [activeSet]);

  const tryDropRef = useRef(tryDrop);
  useEffect(() => { tryDropRef.current = tryDrop; }, [tryDrop]);

  const runDropWithMeasure = useCallback((zoneId: InsulationZoneId, moveX: number, moveY: number) => {
    (sceneRef.current as any)?.measureInWindow?.((sx: number, sy: number) => {
      tryDropRef.current(zoneId, moveX, moveY, sx, sy);
    });
  }, []);
  const runDropWithMeasureRef = useRef(runDropWithMeasure);
  useEffect(() => { runDropWithMeasureRef.current = runDropWithMeasure; }, [runDropWithMeasure]);

  // PanResponder for the ROOF brick — calls through refs to avoid stale closures
  const roofPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDraggingRoof(true);
        dragRoof.setOffset({ x: (dragRoof.x as any)._value ?? 0, y: (dragRoof.y as any)._value ?? 0 });
        dragRoof.setValue({ x: 0, y: 0 });
        Animated.spring(dragRoofScale, { toValue: 1.2, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => { dragRoof.setValue({ x: g.dx, y: g.dy }); },
      onPanResponderRelease: (_, g) => {
        setIsDraggingRoof(false);
        dragRoof.flattenOffset();
        Animated.spring(dragRoofScale, { toValue: 1, useNativeDriver: true }).start();
        runDropWithMeasureRef.current('roof', g.moveX, g.moveY);
        Animated.spring(dragRoof, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // PanResponder for the WALL brick — calls through refs to avoid stale closures
  const wallPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDraggingWall(true);
        dragWall.setOffset({ x: (dragWall.x as any)._value ?? 0, y: (dragWall.y as any)._value ?? 0 });
        dragWall.setValue({ x: 0, y: 0 });
        Animated.spring(dragWallScale, { toValue: 1.2, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => { dragWall.setValue({ x: g.dx, y: g.dy }); },
      onPanResponderRelease: (_, g) => {
        setIsDraggingWall(false);
        dragWall.flattenOffset();
        Animated.spring(dragWallScale, { toValue: 1, useNativeDriver: true }).start();
        runDropWithMeasureRef.current('right-wall', g.moveX, g.moveY);
        Animated.spring(dragWall, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // ---- Guard ----
  if (!level || !config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <GameButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const remaining = config.activeZones.filter((z) => !insulatedZones[z]).length;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />

      {/* ===== COMPACT HEADER ===== */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {levelId === 'w1-l1' ? t('roofShield') : levelId === 'w1-l2' ? t('hotWalls') : levelId === 'w1-l3' ? t('fullProtection') : level.title}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerSub}>
          {Object.keys(insulatedZones).length}/{config.activeZones.length} {t('insulated')}
        </Text>
        <LanguageToggle />
      </View>

      {/* ===== SCENE ===== */}
      <View ref={sceneRef} style={styles.scene} collapsable={false}>
        <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E8F5E9']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

        {/* Clouds */}
        <Animated.View style={{ transform: [{ translateX: cloudX }] }}>
          <Cloud left={SCENE_W * 0.05} top={14} size={52} />
          <Cloud left={SCENE_W * 0.28} top={6} size={44} />
          <Cloud left={SCENE_W * 0.52} top={20} size={38} />
        </Animated.View>

        {/* Sun */}
        <Animated.View style={[styles.sun, { transform: [{ scale: sunScale }] }]}>
          <View style={styles.sunGlow3} />
          <View style={styles.sunGlow2} />
          <View style={styles.sunGlow1} />
          <Text style={styles.sunEmoji}>{'\u2600\uFE0F'}</Text>
        </Animated.View>

        {/* Urdu label near the sun */}
        <View style={styles.sunLabel}>
          <Text style={styles.sunLabelText}>{t('sunScorching')}</Text>
        </View>

        {/* Rays */}
        {RAYS.filter((r) => activeSet.has(r.zone)).map((r) => (
          <Animated.View
            key={r.id}
            style={[styles.ray, {
              left: r.startX, top: r.startY - 4, width: rayLength(r),
              transform: [{ rotate: `${rayAngle(r)}deg` }],
              opacity: rayOpacities[r.zone],
            }]}
          >
            <LinearGradient
              colors={['rgba(255,210,0,0.75)', 'rgba(255,165,0,0.3)', 'rgba(255,120,0,0.06)']}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ))}

        {/* ======= 3D HOUSE ======= */}
        <View style={styles.houseWrap}>

          {/* ---- GROUND SHADOW ---- */}
          <View style={styles.groundShadow} />

          {/* ---- 3D: RIGHT SIDE WALL (behind front, zIndex 1) ---- */}
          <View style={styles.sideWall}>
            {Array.from({ length: Math.floor(WALL_H / 16) }).map((_, i) => (
              <View key={i} style={[styles.sideBrickRow, i % 2 === 1 && { paddingLeft: 8 }]}>
                {Array.from({ length: 3 }).map((__, j) => (
                  <View key={j} style={styles.sideBrick} />
                ))}
              </View>
            ))}
          </View>

          {/* ---- 3D: RIGHT ROOF FACE (behind front roof, zIndex 1) ---- */}
          {/* A darker parallelogram representing the side slope of the roof */}
          <View style={styles.sideRoof}>
            <LinearGradient
              colors={['#6D4C41', '#5D4037']}
              style={StyleSheet.absoluteFill}
            />
            {/* Roof tile lines */}
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  top: 8 + i * 16,
                  height: 2,
                  backgroundColor: 'rgba(0,0,0,0.12)',
                }}
              />
            ))}
          </View>

          {/* ---- 3D: FOUNDATION SIDE EDGE ---- */}
          <View style={styles.foundationSide} />

          {/* ---- CHIMNEY (front face) ---- */}
          <View style={styles.chimney}>
            <View style={styles.chimneyTop} />
            <View style={styles.chimneyFront} />
            {/* Chimney 3D side */}
            <View style={styles.chimneySide} />
          </View>

          {/* ---- FRONT ROOF (triangle, zIndex 2) ---- */}
          <View style={styles.frontRoof}>
            <View style={[styles.roofTriangle, {
              borderLeftWidth: (H_W + ROOF_OVERHANG) / 2,
              borderRightWidth: (H_W + ROOF_OVERHANG) / 2,
              borderBottomWidth: ROOF_H,
            }]} />
            {/* Ridge cap */}
            <View style={[styles.roofRidge, { width: H_W * 0.08 }]} />
            {/* Roof tile lines (decorative) */}
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
            {/* Roof overhang shadow */}
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
              {/* People: 1 man, 1 woman, 1 boy, 1 girl */}
              <View style={styles.peopleRow}>
                <CartoonPerson m={moodVal} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
                <CartoonPerson m={moodVal} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
                <CartoonPerson m={moodVal} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
                <CartoonPerson m={moodVal} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
              </View>
              <Text style={[styles.moodLabel, { color: moodVal.bg === '#C8E6C9' ? '#2E7D32' : moodVal.bg === '#FFCDD2' ? '#C62828' : '#E65100' }]}>
                {moodVal.label}
              </Text>
              {currentTemp >= 32 && (
                <View style={styles.heatWavesRow}>
                  {[0, 1, 2].map((i) => <View key={i} style={styles.heatWaveLine} />)}
                </View>
              )}
              {/* Decorative window */}
              <View style={styles.decoWindowL}>
                <View style={styles.windowPane} />
                <View style={styles.windowCross} />
                <View style={styles.windowCrossH} />
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
            {/* 3D door step */}
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

        {/* Zone overlays (visual drop targets) */}
        {ZONES.filter((z) => activeSet.has(z.id)).map((zone) => {
          const done = !!insulatedZones[zone.id];
          const isRoof = zone.id === 'roof';
          return (
            <View
              key={zone.id}
              pointerEvents="none"
              style={[styles.zone, { left: zone.left, top: zone.top, width: zone.width, height: zone.height }]}
            >
              {done ? (
                <View style={styles.zoneDone}>
                  <View style={styles.insulationLayer}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View key={i} style={styles.insulationStrip} />
                    ))}
                  </View>
                  <View style={styles.zoneDoneBadge}>
                    <Text style={styles.zoneDoneTxt}>{'\u2705'} {t('insulatedLabel')}</Text>
                  </View>
                </View>
              ) : (
                <Animated.View style={[styles.zoneActive, isRoof ? styles.zoneWaitRoof : styles.zoneWaitWall, { opacity: zonePulse }]}>
                  <View style={styles.zoneHintBg}>
                    <Text style={styles.zoneHint}>{t('dropHere')}</Text>
                  </View>
                </Animated.View>
              )}
            </View>
          );
        })}

        {/* Thermometer (right) */}
        <View style={styles.thermoPos}>
          <Thermometer temperature={currentTemp} />
        </View>

        {/* Flash */}
        <Animated.View style={[styles.flash, { opacity: shieldFlash }]} pointerEvents="none" />
      </View>

      {/* ===== DRAG TRAY ===== */}
      <View style={styles.tray}>
        {remaining > 0 && selectedMaterial ? (
          <>
            <Text style={styles.trayLabel}>
              {t('dragInsulation')} {'\u2191'}
            </Text>

            {/* One draggable brick per active zone that is not yet insulated */}
            {activeSet.has('roof') && !insulatedZones['roof'] && (
              <Animated.View
                {...roofPanResponder.panHandlers}
                style={[
                  styles.dragItem,
                  {
                    transform: [...dragRoof.getTranslateTransform(), { scale: dragRoofScale }],
                    zIndex: isDraggingRoof ? 100 : 10,
                  },
                ]}
              >
                <View style={[styles.dragBrick, styles.dragBrickRoof]}>
                  <View style={styles.dragBrickInner}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <View key={i} style={styles.dragStrip} />
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            {activeSet.has('right-wall') && !insulatedZones['right-wall'] && (
              <Animated.View
                {...wallPanResponder.panHandlers}
                style={[
                  styles.dragItem,
                  {
                    transform: [...dragWall.getTranslateTransform(), { scale: dragWallScale }],
                    zIndex: isDraggingWall ? 100 : 10,
                  },
                ]}
              >
                <View style={[styles.dragBrick, styles.dragBrickWall]}>
                  <View style={styles.dragBrickInner}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <View key={i} style={[styles.dragStrip, { backgroundColor: '#FF8A65' }]} />
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </>
        ) : !allDone ? (
          <Text style={styles.trayLabel}>Select a material to begin</Text>
        ) : (
          <Text style={styles.trayLabel}>{t('allInsulated')}</Text>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    height: HEADER_H, paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(230,81,0,0.92)', gap: Spacing.md,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerTitle: { fontFamily: Fonts.rounded, fontSize: FontSizes.lg, fontWeight: '900', color: '#fff' },
  headerSub: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Scene
  scene: { flex: 1, position: 'relative', overflow: 'hidden' },

  // Sun
  sun: {
    position: 'absolute', right: THERMO_W + 20, top: 4,
    width: 80, height: 80, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  sunGlow3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,235,59,0.12)' },
  sunGlow2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,235,59,0.2)' },
  sunGlow1: { position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255,235,59,0.35)' },
  sunEmoji: { fontSize: 58 },

  // Urdu sun label
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
  ray: { position: 'absolute', height: 9, borderRadius: 5, overflow: 'hidden', transformOrigin: 'left center', zIndex: 5 },

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

  // ---- 3D: Side wall ----
  sideWall: {
    position: 'absolute',
    left: H_W,
    top: ROOF_H,
    width: SIDE_D,
    height: WALL_H,
    backgroundColor: '#BCAAA4',
    transform: [{ skewY: '-6deg' }],
    overflow: 'hidden',
    zIndex: 1,
    borderRightWidth: 2,
    borderBottomWidth: 1,
    borderColor: '#8D6E63',
  },
  sideBrickRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  sideBrick: {
    width: 16, height: 12,
    backgroundColor: '#A1887F',
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#8D6E63',
  },

  // ---- 3D: Side roof face ----
  sideRoof: {
    position: 'absolute',
    left: H_W + ROOF_OVERHANG / 2 - 2,
    top: 2,
    width: SIDE_D + 4,
    height: ROOF_H - 2,
    backgroundColor: '#6D4C41',
    transform: [{ skewY: '-12deg' }],
    overflow: 'hidden',
    zIndex: 1,
    borderRightWidth: 2,
    borderColor: '#4E342E',
    borderTopRightRadius: 2,
  },

  // ---- 3D: Foundation side ----
  foundationSide: {
    position: 'absolute',
    left: H_W,
    top: H_H - 14,
    width: SIDE_D,
    height: 10,
    backgroundColor: '#607D8B',
    transform: [{ skewY: '-6deg' }],
    zIndex: 1,
    borderRightWidth: 2,
    borderColor: '#455A64',
  },

  // ---- Chimney ----
  chimney: {
    position: 'absolute',
    left: H_W * 0.17,
    top: -28,
    zIndex: 5,
  },
  chimneyTop: {
    width: 32, height: 8, backgroundColor: '#5D4037',
    borderRadius: 3, zIndex: 2,
  },
  chimneyFront: {
    width: 24, height: 34, backgroundColor: '#795548',
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
    marginLeft: 4,
  },
  chimneySide: {
    position: 'absolute',
    left: 28,
    top: 8,
    width: 10,
    height: 34,
    backgroundColor: '#5D4037',
    transform: [{ skewY: '-6deg' }],
    borderBottomRightRadius: 2,
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
    width: 0, height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8D6E63',
    borderStyle: 'solid',
  },
  roofRidge: {
    height: 6, backgroundColor: '#6D4C41',
    borderRadius: 3, marginTop: -ROOF_H - 3,
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
  brick: { width: 22, height: 14, backgroundColor: '#BCAAA4', borderRadius: 2, borderWidth: 1, borderColor: '#A1887F' },
  interior: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' },
  floorLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#8D6E63' },
  table: { position: 'absolute', bottom: 8, right: 20, alignItems: 'center' },
  tableTop: { width: 36, height: 6, backgroundColor: '#8D6E63', borderRadius: 2 },
  tableLeg: { width: 4, height: 18, backgroundColor: '#6D4C41' },
  decoWindowL: {
    position: 'absolute', left: 14, top: 18, width: 42, height: 42,
    backgroundColor: '#B3E5FC', borderRadius: 4, borderWidth: 3, borderColor: '#8D6E63', overflow: 'hidden',
  },
  windowPane: { ...StyleSheet.absoluteFillObject, backgroundColor: '#B3E5FC' },
  windowCross: { position: 'absolute', left: '48%', top: 0, bottom: 0, width: 3, backgroundColor: '#8D6E63' },
  windowCrossH: { position: 'absolute', top: '48%', left: 0, right: 0, height: 3, backgroundColor: '#8D6E63' },
  peopleRow: { flexDirection: 'row', gap: 6, zIndex: 2, alignItems: 'flex-end', justifyContent: 'center' },
  moodLabel: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, fontWeight: '800', zIndex: 2, marginTop: 2 },
  heatWavesRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  heatWaveLine: { width: 3, height: 14, backgroundColor: '#FF7043', borderRadius: 2, opacity: 0.6, transform: [{ rotate: '8deg' }] },

  // ---- Door ----
  doorWrap: {
    position: 'absolute',
    left: H_W / 2 - 22,
    top: H_H - 72,
    alignItems: 'center',
    zIndex: 3,
  },
  door: {
    width: 40, height: 58, backgroundColor: '#5D4037',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 6, overflow: 'hidden',
  },
  doorInner: {
    width: 32, height: 44, backgroundColor: '#4E342E',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6,
  },
  doorKnob: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD54F' },
  doorArch: {
    position: 'absolute', top: 0, left: 2, right: 2,
    height: 22, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  doorStep: {
    width: 52, height: 8,
    backgroundColor: '#78909C',
    borderRadius: 2,
    marginTop: 1,
    // 3D step depth
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
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCENE_H * 0.16, zIndex: 2 },
  tree: { position: 'absolute', fontSize: 48, zIndex: 3 },
  bush: { position: 'absolute', bottom: 4, fontSize: 26, zIndex: 3 },

  // Zone overlays
  zone: { position: 'absolute', zIndex: 15, borderRadius: Radius.md, overflow: 'visible' },
  zoneActive: {
    flex: 1, borderWidth: 3, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  zoneWaitRoof: {
    borderColor: '#FF6D00',
    backgroundColor: 'rgba(255,111,0,0.22)',
    borderStyle: 'dashed',
  },
  zoneWaitWall: {
    borderColor: '#D32F2F',
    backgroundColor: 'rgba(211,47,47,0.20)',
    borderStyle: 'dashed',
  },
  zoneLblBg: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  zoneLblBgRoof: {
    backgroundColor: 'rgba(255,111,0,0.88)',
  },
  zoneLblBgWall: {
    backgroundColor: 'rgba(211,47,47,0.88)',
  },
  zoneLbl: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  zoneHintBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  zoneHint: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  zoneDone: {
    flex: 1, backgroundColor: 'rgba(76,175,80,0.30)',
    borderWidth: 2.5, borderColor: '#388E3C', borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden',
  },
  insulationLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 3, opacity: 0.45,
  },
  insulationStrip: { width: '100%', height: 8, backgroundColor: '#66BB6A', borderRadius: 2 },
  zoneDoneBadge: {
    backgroundColor: 'rgba(46,125,50,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
  },
  zoneDoneTxt: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    fontWeight: '900', color: '#fff', textAlign: 'center',
  },

  // Thermometer
  thermoPos: {
    position: 'absolute', right: 10, top: 0, bottom: 0,
    width: THERMO_W, alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },

  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(102,187,106,0.15)', zIndex: 25 },

  // Drag tray
  tray: {
    height: TRAY_H, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.xl,
    backgroundColor: 'rgba(62,39,35,0.88)',
  },
  trayLabel: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, fontWeight: '700', color: '#FFE0B2' },
  dragItem: { alignItems: 'center', gap: 4 },
  dragBrick: {
    width: 64, height: 50, backgroundColor: '#FFB74D',
    borderRadius: 8, borderWidth: 2, borderColor: '#F57C00',
    overflow: 'hidden', ...Shadow.md,
  },
  dragBrickRoof: {
    backgroundColor: '#FFB74D',
    borderColor: '#F57C00',
  },
  dragBrickWall: {
    backgroundColor: '#FFAB91',
    borderColor: '#E64A19',
  },
  dragBrickInner: { flex: 1, justifyContent: 'center', gap: 3, padding: 6 },
  dragStrip: { height: 6, backgroundColor: '#FFA726', borderRadius: 2 },
  dragLabel: { fontFamily: Fonts.rounded, fontSize: 11, fontWeight: '800', color: '#FFE0B2' },

  // Error
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  errorText: { fontFamily: Fonts.rounded, fontSize: FontSizes.lg, color: GameColors.textMuted },
});
