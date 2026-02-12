/**
 * EcoHero: Flood Fighters — Insulation Game (Landscape Tablet)
 *
 * Full-screen scene. Drag the insulation brick from the tray at the bottom
 * onto the glowing zones (roof / right wall) to block the sun's rays.
 * Thermometer on the right. No side panels.
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
import { useGame } from '@/context/GameContext';
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
const TRAY_H = 90;                               // drag-tray at the bottom
const SCENE_W = SCR_W;
const SCENE_H = SCR_H - HEADER_H - TRAY_H;

// Thermometer column inset (right side, inside the scene)
const THERMO_W = 80;

// House dimensions
const H_W = Math.min((SCENE_W - THERMO_W - 40) * 0.48, 400);
const H_H = Math.min(SCENE_H * 0.62, 330);
const H_LEFT = (SCENE_W - THERMO_W - H_W) / 2;  // center in area left of thermometer
const H_TOP = SCENE_H * 0.24;

// Roof
const ROOF_H = 72;
const ROOF_OVERHANG = 26;

// Sun
const SUN_CX = (SCENE_W - THERMO_W) * 0.86;
const SUN_CY = 24;

// ---------------------------------------------------------------------------
// Ray geometry helpers
// ---------------------------------------------------------------------------

interface RayDef { id: string; zone: InsulationZoneId; startX: number; startY: number; endX: number; endY: number; }

function rayAngle(r: RayDef) { return Math.atan2(r.endY - r.startY, r.endX - r.startX) * (180 / Math.PI); }
function rayLength(r: RayDef) { return Math.sqrt((r.endX - r.startX) ** 2 + (r.endY - r.startY) ** 2); }

const RAYS: RayDef[] = [
  { id: 'r1', zone: 'roof', startX: SUN_CX - 6,  startY: SUN_CY + 18, endX: H_LEFT + H_W * 0.12, endY: H_TOP },
  { id: 'r2', zone: 'roof', startX: SUN_CX,       startY: SUN_CY + 22, endX: H_LEFT + H_W * 0.32, endY: H_TOP + 6 },
  { id: 'r3', zone: 'roof', startX: SUN_CX + 5,   startY: SUN_CY + 26, endX: H_LEFT + H_W * 0.52, endY: H_TOP + 10 },
  { id: 'r4', zone: 'roof', startX: SUN_CX + 8,   startY: SUN_CY + 30, endX: H_LEFT + H_W * 0.72, endY: H_TOP + 16 },
  { id: 'w1', zone: 'right-wall', startX: SUN_CX - 4, startY: SUN_CY + 34, endX: H_LEFT + H_W + 4, endY: H_TOP + ROOF_H + 30 },
  { id: 'w2', zone: 'right-wall', startX: SUN_CX,     startY: SUN_CY + 38, endX: H_LEFT + H_W + 4, endY: H_TOP + ROOF_H + 80 },
  { id: 'w3', zone: 'right-wall', startX: SUN_CX + 4, startY: SUN_CY + 42, endX: H_LEFT + H_W + 4, endY: H_TOP + ROOF_H + 130 },
  { id: 'w4', zone: 'right-wall', startX: SUN_CX + 8, startY: SUN_CY + 46, endX: H_LEFT + H_W + 2, endY: H_TOP + H_H - 20 },
];

// ---------------------------------------------------------------------------
// Zone hit-boxes (relative to scene origin)
// ---------------------------------------------------------------------------

interface ZoneVis { id: InsulationZoneId; label: string; left: number; top: number; width: number; height: number; }

const ZONES: ZoneVis[] = [
  { id: 'roof', label: 'Roof', left: H_LEFT - ROOF_OVERHANG / 2, top: H_TOP - 6, width: H_W + ROOF_OVERHANG, height: ROOF_H + 10 },
  { id: 'right-wall', label: 'Right Wall', left: H_LEFT + H_W - 22, top: H_TOP + ROOF_H + 2, width: 56, height: H_H - ROOF_H - 16 },
];

// ---------------------------------------------------------------------------
// People mood
// ---------------------------------------------------------------------------

interface Mood { label: string; bg: string; skin: string; cheek: string; mouth: 'frown' | 'neutral' | 'smile' | 'grin'; sweat: boolean; eyeStyle: 'squint' | 'normal' | 'happy'; }

function mood(temp: number): Mood {
  if (temp >= 35) return { label: 'Too hot!', bg: '#FFCDD2', skin: '#FFAB91', cheek: '#EF5350', mouth: 'frown', sweat: true, eyeStyle: 'squint' };
  if (temp >= 30) return { label: 'Very warm', bg: '#FFE0B2', skin: '#FFCC80', cheek: '#FF7043', mouth: 'neutral', sweat: true, eyeStyle: 'squint' };
  if (temp >= 26) return { label: 'Warm', bg: '#FFF9C4', skin: '#FFE0B2', cheek: '#FFB74D', mouth: 'smile', sweat: false, eyeStyle: 'normal' };
  if (temp >= 22) return { label: 'Comfortable!', bg: '#C8E6C9', skin: '#FFCCBC', cheek: '#EF9A9A', mouth: 'grin', sweat: false, eyeStyle: 'happy' };
  return { label: 'Nice & cool!', bg: '#BBDEFB', skin: '#FFCCBC', cheek: '#EF9A9A', mouth: 'grin', sweat: false, eyeStyle: 'happy' };
}

// ---------------------------------------------------------------------------
// Cartoon person (drawn with Views)
// ---------------------------------------------------------------------------

interface PersonProps { m: Mood; shirt: string; pants: string; hair: string; isChild?: boolean; }

function CartoonPerson({ m, shirt, pants, hair, isChild }: PersonProps) {
  const s = isChild ? 0.78 : 1;
  const h = (v: number) => v * s;
  return (
    <View style={{ alignItems: 'center', width: h(52), height: h(110) }}>
      <View style={{ width: h(32), height: h(14), backgroundColor: hair, borderTopLeftRadius: h(16), borderTopRightRadius: h(16), marginBottom: -h(4), zIndex: 2 }} />
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
      <View style={{ width: h(26), height: h(28), backgroundColor: shirt, borderTopLeftRadius: h(4), borderTopRightRadius: h(4), marginTop: h(1), alignItems: 'center' }}>
        <View style={{ width: h(2), height: h(22), backgroundColor: 'rgba(0,0,0,0.08)', marginTop: h(2) }} />
      </View>
      <View style={{ position: 'absolute', top: h(46), flexDirection: 'row', width: h(52), justifyContent: 'space-between' }}>
        <View style={{ width: h(9), height: h(22), backgroundColor: m.skin, borderRadius: h(4), transform: [{ rotate: '12deg' }] }} />
        <View style={{ width: h(9), height: h(22), backgroundColor: m.skin, borderRadius: h(4), transform: [{ rotate: '-12deg' }] }} />
      </View>
      <View style={{ flexDirection: 'row', gap: h(3) }}>
        <View style={{ width: h(11), height: h(24), backgroundColor: pants, borderBottomLeftRadius: h(4), borderBottomRightRadius: h(4) }} />
        <View style={{ width: h(11), height: h(24), backgroundColor: pants, borderBottomLeftRadius: h(4), borderBottomRightRadius: h(4) }} />
      </View>
      <View style={{ flexDirection: 'row', gap: h(3), marginTop: -h(1) }}>
        <View style={{ width: h(13), height: h(5), backgroundColor: '#5D4037', borderRadius: h(3) }} />
        <View style={{ width: h(13), height: h(5), backgroundColor: '#5D4037', borderRadius: h(3) }} />
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

  const moodVal = mood(currentTemp);
  const allDone = config ? config.activeZones.every((z) => insulatedZones[z]) : false;
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

  // ---- Drag & drop state ----
  const dragPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  // The tray origin (where the brick sits) — bottom-left area.
  // We offset relative to the tray item's resting position.
  // The drag position is tracked in absolute screen coordinates via gesture.
  const latestDragRef = useRef({ x: 0, y: 0 });

  const applyInsulation = useCallback((zoneId: InsulationZoneId) => {
    if (!selectedMaterial || insulatedZones[zoneId] || finished) return;
    if (!selectedMaterial.applicableTo.includes(zoneId)) return;

    const newZones = { ...insulatedZones, [zoneId]: selectedMaterial };
    setInsulatedZones(newZones);
    Animated.timing(rayOpacities[zoneId], { toValue: 0, duration: 700, useNativeDriver: true }).start();
    shieldFlash.setValue(1);
    Animated.timing(shieldFlash, { toValue: 0, duration: 900, useNativeDriver: true }).start();

    // If all zones are now insulated, go straight to results after a brief pause
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
      }, 800); // short delay so the child sees the last ray fade out
    }
  }, [selectedMaterial, insulatedZones, finished, config, startTemp, availableMaterials, levelId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        dragPos.setOffset({ x: (dragPos.x as any)._value ?? 0, y: (dragPos.y as any)._value ?? 0 });
        dragPos.setValue({ x: 0, y: 0 });
        Animated.spring(dragScale, { toValue: 1.2, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => {
        dragPos.setValue({ x: g.dx, y: g.dy });
        latestDragRef.current = { x: g.moveX, y: g.moveY };
      },
      onPanResponderRelease: (_, g) => {
        setIsDragging(false);
        dragPos.flattenOffset();
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }).start();

        // Check if dropped on a zone
        // The zones are positioned relative to the scene which starts at y = HEADER_H
        const dropX = g.moveX;
        const dropY = g.moveY - HEADER_H; // convert to scene-relative Y

        let hit = false;
        for (const zone of ZONES) {
          if (!activeSet.has(zone.id)) continue;
          if (insulatedZones[zone.id]) continue;
          if (
            dropX >= zone.left && dropX <= zone.left + zone.width &&
            dropY >= zone.top && dropY <= zone.top + zone.height
          ) {
            applyInsulation(zone.id);
            hit = true;
            break;
          }
        }

        // Snap back to origin
        Animated.spring(dragPos, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
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

  const WALL_H = H_H - ROOF_H - 14;

  // How many active zones left to insulate
  const remaining = config.activeZones.filter((z) => !insulatedZones[z]).length;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />

      {/* ===== COMPACT HEADER ===== */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{level.title}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerSub}>
          {Object.keys(insulatedZones).length}/{config.activeZones.length} insulated
        </Text>
      </View>

      {/* ===== SCENE (full width) ===== */}
      <View style={styles.scene}>
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

        {/* ======= HOUSE ======= */}
        <View style={[styles.house, { left: H_LEFT, top: H_TOP, width: H_W, height: H_H }]}>
          {/* Chimney */}
          <View style={styles.chimney}>
            <View style={styles.chimneyTop} />
            <View style={styles.chimneyBody} />
          </View>
          {/* Roof */}
          <View style={styles.roofRow}>
            <View style={[styles.roofTriangle, {
              borderLeftWidth: (H_W + ROOF_OVERHANG) / 2,
              borderRightWidth: (H_W + ROOF_OVERHANG) / 2,
              borderBottomWidth: ROOF_H,
            }]} />
            <View style={[styles.roofRidge, { width: H_W * 0.08 }]} />
          </View>
          {/* Walls */}
          <View style={[styles.wallsOuter, { height: WALL_H }]}>
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
              <View style={styles.table}><View style={styles.tableTop} /><View style={styles.tableLeg} /></View>
              <View style={styles.peopleRow}>
                <CartoonPerson m={moodVal} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
                <CartoonPerson m={moodVal} shirt="#EF5350" pants="#455A64" hair="#3E2723" />
                {config.activeZones.length > 1 && (
                  <CartoonPerson m={moodVal} shirt="#66BB6A" pants="#4E342E" hair="#FF8F00" isChild />
                )}
              </View>
              <Text style={[styles.moodLabel, { color: moodVal.bg === '#C8E6C9' ? '#2E7D32' : moodVal.bg === '#FFCDD2' ? '#C62828' : '#E65100' }]}>
                {moodVal.label}
              </Text>
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
          {/* Door */}
          <View style={styles.doorWrap}>
            <View style={styles.door}>
              <View style={styles.doorInner}><View style={styles.doorKnob} /></View>
              <View style={styles.doorArch} />
            </View>
          </View>
          <View style={styles.foundation} />
        </View>

        {/* Ground */}
        <View style={styles.ground}>
          <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
        </View>
        <Text style={[styles.tree, { left: H_LEFT - 60, bottom: SCENE_H - H_TOP - H_H + 6 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.tree, { left: H_LEFT + H_W + 20, bottom: SCENE_H - H_TOP - H_H + 10 }]}>{'\u{1F333}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT - 20 }]}>{'\u{1F33F}'}</Text>
        <Text style={[styles.bush, { left: H_LEFT + H_W + 60 }]}>{'\u{1F33F}'}</Text>

        {/* Zone overlays — visual only (drop targets, not tappable) */}
        {ZONES.filter((z) => activeSet.has(z.id)).map((zone) => {
          const done = !!insulatedZones[zone.id];
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
                  <Text style={styles.zoneDoneTxt}>Insulated</Text>
                </View>
              ) : (
                <Animated.View style={[styles.zoneActive, styles.zoneWait, { opacity: zonePulse }]}>
                  <Text style={styles.zoneLbl}>{zone.label}</Text>
                  <Text style={styles.zoneHint}>Drop here!</Text>
                </Animated.View>
              )}
            </View>
          );
        })}

        {/* Thermometer (right side of scene) */}
        <View style={styles.thermoPos}>
          <Thermometer temperature={currentTemp} />
        </View>

        {/* Flash overlay */}
        <Animated.View style={[styles.flash, { opacity: shieldFlash }]} pointerEvents="none" />

        {/* (Results shown automatically after last zone is insulated) */}
      </View>

      {/* ===== DRAG TRAY (bottom bar) ===== */}
      <View style={styles.tray}>
        {remaining > 0 && selectedMaterial ? (
          <>
            <Text style={styles.trayLabel}>
              Drag the insulation to the house {'\u2191'}
            </Text>
            {/* Draggable brick */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.dragItem,
                {
                  transform: [
                    ...dragPos.getTranslateTransform(),
                    { scale: dragScale },
                  ],
                  zIndex: isDragging ? 100 : 10,
                },
              ]}
            >
              <View style={styles.dragBrick}>
                {/* Insulation visual: layered strips */}
                <View style={styles.dragBrickInner}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <View key={i} style={styles.dragStrip} />
                  ))}
                </View>
              </View>
              <Text style={styles.dragLabel}>Insulation</Text>
            </Animated.View>
          </>
        ) : !allDone ? (
          <Text style={styles.trayLabel}>Select a material to begin</Text>
        ) : (
          <Text style={styles.trayLabel}>All zones insulated!</Text>
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

  // Rays
  ray: { position: 'absolute', height: 9, borderRadius: 5, overflow: 'hidden', transformOrigin: 'left center', zIndex: 5 },

  // House
  house: { position: 'absolute', zIndex: 3 },
  chimney: { position: 'absolute', left: '15%', top: -30, zIndex: 4, alignItems: 'center' },
  chimneyTop: { width: 32, height: 8, backgroundColor: '#5D4037', borderRadius: 3 },
  chimneyBody: { width: 24, height: 34, backgroundColor: '#795548', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  roofRow: { alignItems: 'center', zIndex: 4 },
  roofTriangle: { width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#8D6E63', borderStyle: 'solid' },
  roofRidge: { height: 6, backgroundColor: '#6D4C41', borderRadius: 3, marginTop: -ROOF_H - 3 },
  wallsOuter: { flexDirection: 'row', overflow: 'hidden', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  wallPanel: { width: 28, backgroundColor: '#D7CCC8', overflow: 'hidden' },
  wallPanelR: { width: 28, backgroundColor: '#D7CCC8', overflow: 'hidden' },
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
  peopleRow: { flexDirection: 'row', gap: 10, zIndex: 2, alignItems: 'flex-end', justifyContent: 'center' },
  moodLabel: { fontFamily: Fonts.rounded, fontSize: FontSizes.md, fontWeight: '800', zIndex: 2, marginTop: 2 },
  heatWavesRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  heatWaveLine: { width: 3, height: 14, backgroundColor: '#FF7043', borderRadius: 2, opacity: 0.6, transform: [{ rotate: '8deg' }] },
  doorWrap: { alignItems: 'center', marginTop: -2 },
  door: { width: 40, height: 58, backgroundColor: '#5D4037', borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, overflow: 'hidden' },
  doorInner: { width: 32, height: 44, backgroundColor: '#4E342E', borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 },
  doorKnob: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD54F' },
  doorArch: { position: 'absolute', top: 0, left: 2, right: 2, height: 22, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  foundation: { height: 10, backgroundColor: '#78909C', borderRadius: 2, marginTop: 1 },

  // Ground
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCENE_H * 0.16, zIndex: 2 },
  tree: { position: 'absolute', fontSize: 48, zIndex: 3 },
  bush: { position: 'absolute', bottom: 4, fontSize: 26, zIndex: 3 },

  // Zone overlays
  zone: { position: 'absolute', zIndex: 15, borderRadius: Radius.sm, overflow: 'hidden' },
  zoneActive: { flex: 1, borderWidth: 3, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', gap: 2 },
  zoneWait: { borderColor: 'rgba(255,152,0,0.75)', backgroundColor: 'rgba(255,152,0,0.12)', borderStyle: 'dashed' },
  zoneLbl: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '800', color: '#E65100', textAlign: 'center' },
  zoneHint: { fontFamily: Fonts.rounded, fontSize: 11, fontWeight: '700', color: GameColors.textSecondary, textAlign: 'center' },
  zoneDone: {
    flex: 1, backgroundColor: 'rgba(255,183,77,0.35)',
    borderWidth: 2, borderColor: '#F57C00', borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden',
  },
  insulationLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 3, opacity: 0.5,
  },
  insulationStrip: {
    width: '100%', height: 8,
    backgroundColor: '#FFB74D', borderRadius: 2,
  },
  zoneDoneTxt: { fontFamily: Fonts.rounded, fontSize: 11, fontWeight: '800', color: '#E65100', textAlign: 'center', zIndex: 2 },

  // Thermometer (right side)
  thermoPos: {
    position: 'absolute', right: 10, top: 0, bottom: 0,
    width: THERMO_W, alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },

  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(102,187,106,0.15)', zIndex: 25 },

  // Drag tray
  tray: {
    height: TRAY_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    backgroundColor: 'rgba(62,39,35,0.88)',
  },
  trayLabel: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.md,
    fontWeight: '700', color: '#FFE0B2',
  },
  dragItem: {
    alignItems: 'center', gap: 4,
  },
  dragBrick: {
    width: 64, height: 50,
    backgroundColor: '#FFB74D',
    borderRadius: 8, borderWidth: 2, borderColor: '#F57C00',
    overflow: 'hidden',
    ...Shadow.md,
  },
  dragBrickInner: {
    flex: 1, justifyContent: 'center', gap: 3, padding: 6,
  },
  dragStrip: {
    height: 6, backgroundColor: '#FFA726', borderRadius: 2,
  },
  dragLabel: {
    fontFamily: Fonts.rounded, fontSize: 11, fontWeight: '800', color: '#FFE0B2',
  },

  // Error
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  errorText: { fontFamily: Fonts.rounded, fontSize: FontSizes.lg, color: GameColors.textMuted },
});
