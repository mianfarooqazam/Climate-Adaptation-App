/**
 * EcoHero: Flood Fighters — Insulation Game (Landscape Tablet)
 *
 * Full-screen landscape layout with a detailed cartoon house.
 * Sun in the top-right, animated rays through the roof & right wall,
 * people reacting inside, and a thermometer on the left.
 *
 * Layout (landscape):
 *  ┌──────┬──────────────────────────────┬────────────┐
 *  │Therm.│  Sky + Sun + House + Rays    │  Info /    │
 *  │      │  Clouds, grass, trees        │  Controls  │
 *  └──────┴──────────────────────────────┴────────────┘
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
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
// Responsive dimensions for landscape tablet
// ---------------------------------------------------------------------------

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const SIDE_W = 110;                       // thermometer column
const PANEL_W = 240;                      // right info panel
const SCENE_W = SCR_W - SIDE_W - PANEL_W; // center scene
const SCENE_H = SCR_H - 70;              // minus compact header

// House dimensions (large, centered in the scene)
const H_W = Math.min(SCENE_W * 0.55, 380);
const H_H = Math.min(SCENE_H * 0.6, 320);
const H_LEFT = (SCENE_W - H_W) / 2;
const H_TOP = SCENE_H * 0.28;

// Roof triangle
const ROOF_H = 70;
const ROOF_OVERHANG = 24;

// Sun position (top-right of scene)
const SUN_CX = SCENE_W * 0.88;
const SUN_CY = 30;

// ---------------------------------------------------------------------------
// Ray geometry helpers
// ---------------------------------------------------------------------------

interface RayDef {
  id: string;
  zone: InsulationZoneId;
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

// Rays from sun toward the house
const RAYS: RayDef[] = [
  // Roof rays — fan across the roof top
  { id: 'r1', zone: 'roof', startX: SUN_CX - 6,  startY: SUN_CY + 18, endX: H_LEFT + H_W * 0.15, endY: H_TOP },
  { id: 'r2', zone: 'roof', startX: SUN_CX,       startY: SUN_CY + 22, endX: H_LEFT + H_W * 0.35, endY: H_TOP + 6 },
  { id: 'r3', zone: 'roof', startX: SUN_CX + 5,   startY: SUN_CY + 26, endX: H_LEFT + H_W * 0.55, endY: H_TOP + 10 },
  { id: 'r4', zone: 'roof', startX: SUN_CX + 8,   startY: SUN_CY + 30, endX: H_LEFT + H_W * 0.72, endY: H_TOP + 16 },
  // Right-wall rays — hit the right side of the house
  { id: 'w1', zone: 'right-wall', startX: SUN_CX - 4,  startY: SUN_CY + 34, endX: H_LEFT + H_W + 4, endY: H_TOP + ROOF_H + 30 },
  { id: 'w2', zone: 'right-wall', startX: SUN_CX,       startY: SUN_CY + 38, endX: H_LEFT + H_W + 4, endY: H_TOP + ROOF_H + 80 },
  { id: 'w3', zone: 'right-wall', startX: SUN_CX + 4,   startY: SUN_CY + 42, endX: H_LEFT + H_W + 4, endY: H_TOP + ROOF_H + 130 },
  { id: 'w4', zone: 'right-wall', startX: SUN_CX + 8,   startY: SUN_CY + 46, endX: H_LEFT + H_W + 2, endY: H_TOP + H_H - 20 },
];

// ---------------------------------------------------------------------------
// Zone overlay positions (relative to scene)
// ---------------------------------------------------------------------------

interface ZoneVis { id: InsulationZoneId; label: string; left: number; top: number; width: number; height: number; }

const ZONES: ZoneVis[] = [
  {
    id: 'roof',
    label: 'Roof',
    left: H_LEFT - ROOF_OVERHANG / 2,
    top: H_TOP - 6,
    width: H_W + ROOF_OVERHANG,
    height: ROOF_H + 10,
  },
  {
    id: 'right-wall',
    label: 'Right Wall',
    left: H_LEFT + H_W - 22,
    top: H_TOP + ROOF_H + 2,
    width: 52,
    height: H_H - ROOF_H - 16,
  },
];

// ---------------------------------------------------------------------------
// People mood
// ---------------------------------------------------------------------------

function mood(temp: number) {
  if (temp >= 35) return { emoji: '\u{1F975}', label: 'Too hot!', bg: '#FFCDD2' };
  if (temp >= 30) return { emoji: '\u{1F613}', label: 'Very warm', bg: '#FFE0B2' };
  if (temp >= 26) return { emoji: '\u{1F60C}', label: 'Warm', bg: '#FFF9C4' };
  if (temp >= 22) return { emoji: '\u{1F60A}', label: 'Comfortable!', bg: '#C8E6C9' };
  return { emoji: '\u{1F60E}', label: 'Nice & cool!', bg: '#BBDEFB' };
}

// ---------------------------------------------------------------------------
// Cloud decoration
// ---------------------------------------------------------------------------

function Cloud({ left, top, size }: { left: number; top: number; size: number }) {
  const s = size;
  return (
    <View style={{ position: 'absolute', left, top, flexDirection: 'row', zIndex: 1 }}>
      <View style={{ width: s * 0.6, height: s * 0.45, borderRadius: s * 0.25, backgroundColor: 'rgba(255,255,255,0.85)', marginTop: s * 0.15 }} />
      <View style={{ width: s, height: s * 0.6, borderRadius: s * 0.3, backgroundColor: 'rgba(255,255,255,0.9)', marginLeft: -s * 0.15, marginTop: 0 }} />
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
    () => config ? INSULATION_MATERIALS.filter((m) => config.availableMaterials.includes(m.id)) : [],
    [config],
  );

  // State
  const [selectedMaterial, setSelectedMaterial] = useState<InsulationMaterial | null>(null);
  useEffect(() => {
    if (availableMaterials.length === 1 && !selectedMaterial) setSelectedMaterial(availableMaterials[0]);
  }, [availableMaterials]);

  const [insulatedZones, setInsulatedZones] = useState<Record<string, InsulationMaterial>>({});
  const [lastInsulated, setLastInsulated] = useState<{ zone: InsulationZoneId; material: InsulationMaterial } | null>(null);
  const [finished, setFinished] = useState(false);

  const startTemp = config?.startTemp ?? 38;
  const currentTemp = useMemo(() => {
    const cool = Object.values(insulatedZones).reduce((s, m) => s + m.tempEffect, 0);
    return Math.max(startTemp - cool, 12);
  }, [insulatedZones, startTemp]);

  const m = mood(currentTemp);
  const allDone = config ? config.activeZones.every((z) => insulatedZones[z]) : false;

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

  // Cloud float
  const cloudX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(cloudX, { toValue: 18, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(cloudX, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  // ---- Handlers ----
  const handleZoneTap = useCallback((zoneId: InsulationZoneId) => {
    if (finished || !selectedMaterial || insulatedZones[zoneId]) return;
    if (!selectedMaterial.applicableTo.includes(zoneId)) return;

    setInsulatedZones((prev) => ({ ...prev, [zoneId]: selectedMaterial }));
    setLastInsulated({ zone: zoneId, material: selectedMaterial });

    Animated.timing(rayOpacities[zoneId], { toValue: 0, duration: 700, useNativeDriver: true }).start();
    shieldFlash.setValue(1);
    Animated.timing(shieldFlash, { toValue: 0, duration: 900, useNativeDriver: true }).start();
  }, [selectedMaterial, insulatedZones, finished]);

  const handleFinish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    const pts = Object.values(insulatedZones).reduce((s, mat) => s + mat.points, 0);
    const maxPts = config ? config.activeZones.reduce((s, z) => {
      const best = availableMaterials.filter((mat) => mat.applicableTo.includes(z)).reduce((mx, mat) => Math.max(mx, mat.points), 0);
      return s + best;
    }, 0) : 1;
    const bonus = currentTemp <= (config?.targetTemp ?? 24) ? Math.round(maxPts * 0.3) : 0;
    const score = pts + bonus;
    const maxScore = Math.round(maxPts * 1.3);
    const stars = completeLevel(levelId ?? '', score, maxScore);
    router.replace({ pathname: '/level-complete', params: { levelId: levelId ?? '', stars: String(stars), score: String(score), maxScore: String(maxScore) } });
  }, [insulatedZones, currentTemp, config, levelId, finished, availableMaterials]);

  // ---- Guard ----
  if (!level || !config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <GameButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const activeSet = new Set(config.activeZones);
  const WALL_H = H_H - ROOF_H - 14;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#81D4FA', '#B3E5FC', '#E1F5FE']} style={StyleSheet.absoluteFill} />

      {/* ===== COMPACT HEADER ===== */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{level.title}</Text>
        <Text style={styles.headerSub}>
          Zones: {Object.keys(insulatedZones).length}/{config.activeZones.length}
        </Text>
      </View>

      {/* ===== MAIN ROW ===== */}
      <View style={styles.mainRow}>

        {/* ---- LEFT: Thermometer ---- */}
        <View style={styles.thermoCol}>
          <Thermometer temperature={currentTemp} />
        </View>

        {/* ---- CENTER: Scene ---- */}
        <View style={styles.scene}>
          {/* Sky gradient */}
          <LinearGradient
            colors={['#81D4FA', '#B3E5FC', '#E8F5E9']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Clouds (float gently) */}
          <Animated.View style={{ transform: [{ translateX: cloudX }] }}>
            <Cloud left={SCENE_W * 0.08} top={14} size={52} />
            <Cloud left={SCENE_W * 0.36} top={6} size={44} />
            <Cloud left={SCENE_W * 0.62} top={20} size={38} />
          </Animated.View>

          {/* Sun glow + emoji */}
          <Animated.View style={[styles.sun, { transform: [{ scale: sunScale }] }]}>
            <View style={styles.sunGlow3} />
            <View style={styles.sunGlow2} />
            <View style={styles.sunGlow1} />
            <Text style={styles.sunEmoji}>{'\u2600\uFE0F'}</Text>
          </Animated.View>

          {/* Sun rays */}
          {RAYS.filter((r) => activeSet.has(r.zone)).map((r) => (
            <Animated.View
              key={r.id}
              style={[styles.ray, {
                left: r.startX, top: r.startY - 4,
                width: rayLength(r),
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

            {/* --- CHIMNEY --- */}
            <View style={styles.chimney}>
              <View style={styles.chimneyTop} />
              <View style={styles.chimneyBody} />
            </View>

            {/* --- ROOF (triangle via borders) --- */}
            <View style={styles.roofRow}>
              <View style={[styles.roofTriangle, {
                borderLeftWidth: (H_W + ROOF_OVERHANG) / 2,
                borderRightWidth: (H_W + ROOF_OVERHANG) / 2,
                borderBottomWidth: ROOF_H,
              }]} />
              {/* Roof ridge line */}
              <View style={[styles.roofRidge, { width: H_W * 0.08 }]} />
            </View>

            {/* --- WALLS --- */}
            <View style={[styles.wallsOuter, { height: WALL_H }]}>
              {/* Brick-style left wall */}
              <View style={styles.wallPanel}>
                {/* Decorative brick rows */}
                {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                  <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 12 }]}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <View key={j} style={styles.brick} />
                    ))}
                  </View>
                ))}
              </View>

              {/* Interior (visible through "cut-away") */}
              <View style={[styles.interior, { backgroundColor: m.bg }]}>
                {/* Floor line */}
                <View style={styles.floorLine} />
                {/* Furniture — small table */}
                <View style={styles.table}>
                  <View style={styles.tableTop} />
                  <View style={styles.tableLeg} />
                </View>
                {/* People */}
                <View style={styles.peopleRow}>
                  <Text style={styles.person}>{m.emoji}</Text>
                  <Text style={styles.person}>{m.emoji}</Text>
                  {config.activeZones.length > 1 && (
                    <Text style={styles.person}>{m.emoji}</Text>
                  )}
                </View>
                <Text style={[styles.moodLabel, { color: m.bg === '#C8E6C9' ? '#2E7D32' : m.bg === '#FFCDD2' ? '#C62828' : '#E65100' }]}>
                  {m.label}
                </Text>
                {currentTemp >= 32 && <Text style={styles.heatWaves}>{'\u{1F525}\u{1F525}\u{1F525}'}</Text>}
                {/* Decorative window (left side, non-interactive) */}
                <View style={styles.decoWindowL}>
                  <View style={styles.windowPane} />
                  <View style={styles.windowCross} />
                  <View style={styles.windowCrossH} />
                </View>
              </View>

              {/* Right wall panel */}
              <View style={styles.wallPanelR}>
                {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
                  <View key={i} style={[styles.brickRow, i % 2 === 1 && { paddingLeft: 10 }]}>
                    <View style={styles.brick} />
                  </View>
                ))}
              </View>
            </View>

            {/* --- DOOR --- */}
            <View style={styles.doorWrap}>
              <View style={styles.door}>
                <View style={styles.doorInner}>
                  <View style={styles.doorKnob} />
                </View>
                <View style={styles.doorArch} />
              </View>
            </View>

            {/* --- FOUNDATION --- */}
            <View style={styles.foundation} />
          </View>

          {/* ======= GROUND ======= */}
          <View style={styles.ground}>
            <LinearGradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} />
          </View>
          {/* Trees & bushes */}
          <Text style={[styles.tree, { left: H_LEFT - 60, bottom: SCENE_H - H_TOP - H_H + 6 }]}>{'\u{1F333}'}</Text>
          <Text style={[styles.tree, { left: H_LEFT + H_W + 20, bottom: SCENE_H - H_TOP - H_H + 10 }]}>{'\u{1F333}'}</Text>
          <Text style={[styles.bush, { left: H_LEFT - 20 }]}>{'\u{1F33F}'}</Text>
          <Text style={[styles.bush, { left: H_LEFT + H_W - 10 }]}>{'\u{1F33A}'}</Text>
          <Text style={[styles.bush, { left: H_LEFT + H_W + 60 }]}>{'\u{1F33F}'}</Text>

          {/* ======= INSULATION ZONES (tappable) ======= */}
          {ZONES.filter((z) => activeSet.has(z.id)).map((zone) => {
            const done = !!insulatedZones[zone.id];
            const ok = selectedMaterial && !done && selectedMaterial.applicableTo.includes(zone.id);
            return (
              <Pressable
                key={zone.id}
                onPress={() => handleZoneTap(zone.id)}
                style={[styles.zone, { left: zone.left, top: zone.top, width: zone.width, height: zone.height }]}
              >
                {done ? (
                  <View style={styles.zoneDone}>
                    <Text style={styles.zoneDoneEmoji}>{'\u{1F6E1}\uFE0F'}</Text>
                    <Text style={styles.zoneDoneTxt}>{'\u2705'} Insulated</Text>
                  </View>
                ) : (
                  <Animated.View style={[styles.zoneActive, ok ? styles.zoneOk : styles.zoneWait, { opacity: ok ? 1 : zonePulse }]}>
                    <Text style={styles.zoneLbl}>{zone.label}</Text>
                    <Text style={styles.zoneHint}>TAP to insulate!</Text>
                  </Animated.View>
                )}
              </Pressable>
            );
          })}

          {/* Flash */}
          <Animated.View style={[styles.flash, { opacity: shieldFlash }]} pointerEvents="none" />
        </View>

        {/* ---- RIGHT: Info panel ---- */}
        <View style={styles.panel}>
          {/* Level info */}
          <View style={styles.panelCard}>
            <Text style={styles.panelCardTitle}>{'\u{1F3E0}'} {level.title}</Text>
            <Text style={styles.panelCardDesc}>{level.description}</Text>
          </View>

          {/* Last action feedback */}
          {lastInsulated && (
            <View style={[styles.panelCard, { borderColor: '#4CAF50', borderWidth: 2 }]}>
              <Text style={styles.panelFeedbackTitle}>
                {'\u2705'} {lastInsulated.zone === 'roof' ? 'Roof' : 'Right Wall'} insulated!
              </Text>
              <Text style={styles.panelFeedbackDesc}>
                {lastInsulated.material.description}
              </Text>
              <Text style={styles.panelFeedbackEffect}>
                {'\u{1F321}\uFE0F'} Cooled by {lastInsulated.material.tempEffect}°C
              </Text>
            </View>
          )}

          {/* Instruction or done */}
          {allDone && !finished ? (
            <View style={[styles.panelCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.panelSuccessEmoji}>{'\u{1F389}'}</Text>
              <Text style={styles.panelSuccessTitle}>House insulated!</Text>
              <Text style={styles.panelSuccessDesc}>
                {startTemp}°C {'\u2192'} {currentTemp}°C
              </Text>
              <GameButton
                title="See Results"
                emoji={'\u{2B50}'}
                onPress={handleFinish}
                color={GameColors.primary}
                size="md"
              />
            </View>
          ) : !allDone ? (
            <View style={[styles.panelCard, { backgroundColor: '#FFF3E0', borderColor: '#FFB74D', borderWidth: 2 }]}>
              <Text style={styles.panelInstrTitle}>
                {'\u{1F9F1}'} Tap the glowing zones!
              </Text>
              <Text style={styles.panelInstrDesc}>
                Add insulation to block the sun{'\u2019'}s rays and cool the house.
              </Text>
            </View>
          ) : null}

          {/* Back button at bottom */}
          <Pressable onPress={() => router.back()} style={styles.panelBackBtn}>
            <Text style={styles.panelBackTxt}>{'\u2190'} Back to levels</Text>
          </Pressable>
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

  // ---- HEADER (compact for landscape) ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(230,81,0,0.92)',
    gap: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerTitle: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.xl,
    fontWeight: '900', color: '#fff',
  },
  headerSub: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)', fontWeight: '600',
  },

  // ---- MAIN ROW ----
  mainRow: { flex: 1, flexDirection: 'row' },

  // ---- THERMOMETER COLUMN ----
  thermoCol: {
    width: SIDE_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // ---- SCENE (center) ----
  scene: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  // Sun
  sun: {
    position: 'absolute', right: SCENE_W * 0.04, top: 4,
    width: 80, height: 80,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  sunGlow3: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,235,59,0.12)',
  },
  sunGlow2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,235,59,0.2)',
  },
  sunGlow1: {
    position: 'absolute', width: 82, height: 82, borderRadius: 41,
    backgroundColor: 'rgba(255,235,59,0.35)',
  },
  sunEmoji: { fontSize: 58 },

  // Rays
  ray: {
    position: 'absolute', height: 9, borderRadius: 5,
    overflow: 'hidden', transformOrigin: 'left center', zIndex: 5,
  },

  // ---- HOUSE ----
  house: { position: 'absolute', zIndex: 3 },

  chimney: {
    position: 'absolute', left: '15%', top: -30, zIndex: 4,
    alignItems: 'center',
  },
  chimneyTop: {
    width: 32, height: 8, backgroundColor: '#5D4037',
    borderRadius: 3,
  },
  chimneyBody: {
    width: 24, height: 34, backgroundColor: '#795548',
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
  },

  roofRow: { alignItems: 'center', zIndex: 4 },
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

  wallsOuter: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  wallPanel: {
    width: 28,
    backgroundColor: '#D7CCC8',
    overflow: 'hidden',
  },
  wallPanelR: {
    width: 28,
    backgroundColor: '#D7CCC8',
    overflow: 'hidden',
  },
  brickRow: {
    flexDirection: 'row', gap: 2, marginBottom: 2,
  },
  brick: {
    width: 22, height: 14,
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
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: '#8D6E63',
  },
  table: {
    position: 'absolute', bottom: 8, right: 20,
    alignItems: 'center',
  },
  tableTop: {
    width: 36, height: 6, backgroundColor: '#8D6E63',
    borderRadius: 2,
  },
  tableLeg: {
    width: 4, height: 18, backgroundColor: '#6D4C41',
  },

  decoWindowL: {
    position: 'absolute', left: 14, top: 18,
    width: 42, height: 42,
    backgroundColor: '#B3E5FC',
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#8D6E63',
    overflow: 'hidden',
  },
  windowPane: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#B3E5FC',
  },
  windowCross: {
    position: 'absolute', left: '48%', top: 0, bottom: 0,
    width: 3, backgroundColor: '#8D6E63',
  },
  windowCrossH: {
    position: 'absolute', top: '48%', left: 0, right: 0,
    height: 3, backgroundColor: '#8D6E63',
  },

  peopleRow: { flexDirection: 'row', gap: 8, zIndex: 2 },
  person: { fontSize: 42 },
  moodLabel: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.md,
    fontWeight: '800', zIndex: 2,
  },
  heatWaves: { fontSize: 18 },

  doorWrap: { alignItems: 'center', marginTop: -2 },
  door: {
    width: 40, height: 58,
    backgroundColor: '#5D4037',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 6, overflow: 'hidden',
  },
  doorInner: {
    width: 32, height: 44,
    backgroundColor: '#4E342E',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    alignItems: 'flex-end', justifyContent: 'center',
    paddingRight: 6,
  },
  doorKnob: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#FFD54F',
  },
  doorArch: {
    position: 'absolute', top: 0, left: 2, right: 2,
    height: 22, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  foundation: {
    height: 10, backgroundColor: '#78909C',
    borderRadius: 2, marginTop: 1,
  },

  // ---- GROUND ----
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCENE_H * 0.16,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
    zIndex: 2,
  },
  tree: { position: 'absolute', fontSize: 48, zIndex: 3 },
  bush: { position: 'absolute', bottom: 4, fontSize: 26, zIndex: 3 },

  // ---- ZONE OVERLAYS ----
  zone: { position: 'absolute', zIndex: 15, borderRadius: Radius.sm, overflow: 'hidden' },
  zoneActive: {
    flex: 1, borderWidth: 3, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  zoneWait: {
    borderColor: 'rgba(255,152,0,0.75)', backgroundColor: 'rgba(255,152,0,0.12)',
    borderStyle: 'dashed',
  },
  zoneOk: {
    borderColor: '#66BB6A', backgroundColor: 'rgba(102,187,106,0.2)',
    borderStyle: 'solid',
  },
  zoneLbl: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    fontWeight: '800', color: '#E65100', textAlign: 'center',
  },
  zoneHint: {
    fontFamily: Fonts.rounded, fontSize: 10,
    fontWeight: '700', color: GameColors.textSecondary, textAlign: 'center',
  },
  zoneDone: {
    flex: 1, backgroundColor: 'rgba(76,175,80,0.28)',
    borderWidth: 2, borderColor: '#4CAF50', borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  zoneDoneEmoji: { fontSize: 24 },
  zoneDoneTxt: {
    fontFamily: Fonts.rounded, fontSize: 10,
    fontWeight: '700', color: '#2E7D32', textAlign: 'center',
  },

  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(102,187,106,0.15)', zIndex: 25,
  },

  // ---- RIGHT PANEL ----
  panel: {
    width: PANEL_W,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'flex-start',
  },
  panelCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 6,
    ...Shadow.sm,
  },
  panelCardTitle: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.md,
    fontWeight: '800', color: '#E65100',
  },
  panelCardDesc: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    color: GameColors.textSecondary, lineHeight: 18,
  },
  panelFeedbackTitle: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.md,
    fontWeight: '700', color: '#2E7D32',
  },
  panelFeedbackDesc: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.xs,
    color: GameColors.textSecondary,
  },
  panelFeedbackEffect: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    fontWeight: '700', color: GameColors.water,
  },
  panelInstrTitle: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.md,
    fontWeight: '700', color: '#E65100',
  },
  panelInstrDesc: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    color: GameColors.textSecondary, lineHeight: 18,
  },
  panelSuccessEmoji: { fontSize: 36, textAlign: 'center' },
  panelSuccessTitle: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.lg,
    fontWeight: '900', color: '#2E7D32', textAlign: 'center',
  },
  panelSuccessDesc: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.md,
    color: GameColors.textSecondary, textAlign: 'center',
  },
  panelBackBtn: {
    marginTop: 'auto',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  panelBackTxt: {
    fontFamily: Fonts.rounded, fontSize: FontSizes.sm,
    fontWeight: '600', color: GameColors.textMuted,
  },

  // Error
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  errorText: { fontFamily: Fonts.rounded, fontSize: FontSizes.lg, color: GameColors.textMuted },
});
