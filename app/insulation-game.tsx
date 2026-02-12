/**
 * EcoHero: Flood Fighters — Insulation Game
 *
 * A visual, interactive mini-game where children see a large house with
 * the sun in the top-right corner. Animated sun rays penetrate through
 * the roof, right wall, and window. The people inside are sweating!
 *
 * The player selects an insulation material, then taps a glowing zone
 * on the house (roof / right wall / window) to apply it. Each insulated
 * zone blocks the sun rays — the rays fade out, the thermometer drops,
 * and the people inside go from hot to comfortable.
 *
 * No quizzes — purely visual and tactile learning.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GameHeader from '@/components/game/GameHeader';
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

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_W = SCREEN_W - Spacing.md * 2;
const SCENE_H = 400;

// ---------------------------------------------------------------------------
// Sun-ray geometry helpers
// ---------------------------------------------------------------------------

interface RayDef {
  id: string;
  zone: InsulationZoneId;
  /** left of the ray origin (sun-end) */
  startX: number;
  startY: number;
  /** left of the ray target (house-end) */
  endX: number;
  endY: number;
}

function rayAngle(r: RayDef) {
  const dx = r.endX - r.startX;
  const dy = r.endY - r.startY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function rayLength(r: RayDef) {
  const dx = r.endX - r.startX;
  const dy = r.endY - r.startY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Pre-calculated ray definitions (relative to scene)
const SUN_CX = SCENE_W * 0.84;
const SUN_CY = 32;

const RAYS: RayDef[] = [
  // Roof rays (3 beams hitting the top of the house)
  { id: 'roof-1', zone: 'roof', startX: SUN_CX - 8, startY: SUN_CY + 15, endX: SCENE_W * 0.38, endY: 108 },
  { id: 'roof-2', zone: 'roof', startX: SUN_CX - 2, startY: SUN_CY + 20, endX: SCENE_W * 0.48, endY: 112 },
  { id: 'roof-3', zone: 'roof', startX: SUN_CX + 4, startY: SUN_CY + 24, endX: SCENE_W * 0.56, endY: 116 },
  // Right-wall rays (3 beams hitting the right side)
  { id: 'wall-1', zone: 'right-wall', startX: SUN_CX - 5, startY: SUN_CY + 28, endX: SCENE_W * 0.66, endY: 175 },
  { id: 'wall-2', zone: 'right-wall', startX: SUN_CX, startY: SUN_CY + 32, endX: SCENE_W * 0.68, endY: 220 },
  { id: 'wall-3', zone: 'right-wall', startX: SUN_CX + 5, startY: SUN_CY + 36, endX: SCENE_W * 0.67, endY: 265 },
];

// ---------------------------------------------------------------------------
// Zone visual definitions
// ---------------------------------------------------------------------------

interface ZoneVisual {
  id: InsulationZoneId;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

const ZONE_VISUALS: ZoneVisual[] = [
  { id: 'roof', label: 'Roof', left: SCENE_W * 0.1, top: 85, width: SCENE_W * 0.58, height: 48 },
  { id: 'right-wall', label: 'Right Wall', left: SCENE_W * 0.6, top: 140, width: 50, height: 175 },
];

// ---------------------------------------------------------------------------
// People mood
// ---------------------------------------------------------------------------

function peopleMood(temp: number): { emoji: string; label: string; color: string } {
  if (temp >= 35) return { emoji: '\u{1F975}', label: 'Too hot!', color: '#D32F2F' };
  if (temp >= 30) return { emoji: '\u{1F613}', label: 'Very warm', color: '#F44336' };
  if (temp >= 26) return { emoji: '\u{1F60C}', label: 'Warm', color: '#FF9800' };
  if (temp >= 22) return { emoji: '\u{1F60A}', label: 'Comfortable!', color: '#66BB6A' };
  return { emoji: '\u{1F60E}', label: 'Nice & cool!', color: '#42A5F5' };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InsulationGameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { completeLevel } = useGame();

  const level = getLevelById(levelId ?? '');
  const world = getWorldById(level?.worldId ?? '');
  const config = INSULATION_LEVEL_CONFIGS[levelId ?? ''];

  const availableMaterials = useMemo(
    () =>
      config
        ? INSULATION_MATERIALS.filter((m) => config.availableMaterials.includes(m.id))
        : [],
    [config],
  );

  // State — auto-select the single insulation material
  const [selectedMaterial, setSelectedMaterial] = useState<InsulationMaterial | null>(null);

  // Auto-select when there's only one material
  useEffect(() => {
    if (availableMaterials.length === 1 && !selectedMaterial) {
      setSelectedMaterial(availableMaterials[0]);
    }
  }, [availableMaterials]);
  const [insulatedZones, setInsulatedZones] = useState<Record<string, InsulationMaterial>>({});
  const [lastInsulated, setLastInsulated] = useState<{ zone: InsulationZoneId; material: InsulationMaterial } | null>(null);
  const [timeLeft, setTimeLeft] = useState(config?.timeLimit ?? 0);
  const [finished, setFinished] = useState(false);

  // Temperature
  const startTemp = config?.startTemp ?? 38;
  const currentTemp = useMemo(() => {
    const cooling = Object.values(insulatedZones).reduce(
      (sum, mat) => sum + mat.tempEffect,
      0,
    );
    return Math.max(startTemp - cooling, 12);
  }, [insulatedZones, startTemp]);

  const mood = peopleMood(currentTemp);
  const allZonesInsulated = config
    ? config.activeZones.every((z) => insulatedZones[z])
    : false;

  // --- Animated values ---
  // Sun pulse
  const sunScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunScale, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sunScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Ray opacities per zone
  const rayOpacities = useRef<Record<string, Animated.Value>>({
    roof: new Animated.Value(1),
    'right-wall': new Animated.Value(1),
  }).current;

  // Zone glow pulse (for uninsulated active zones)
  const zonePulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(zonePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(zonePulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Shield flash when a zone is insulated
  const shieldFlash = useRef(new Animated.Value(0)).current;

  // Timer (for level 5)
  useEffect(() => {
    if (!config?.timeLimit || finished) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished, config?.timeLimit]);

  // --- Handlers ---
  const handleZoneTap = useCallback(
    (zoneId: InsulationZoneId) => {
      if (finished) return;
      if (!selectedMaterial) return;
      if (insulatedZones[zoneId]) return; // already insulated
      if (!selectedMaterial.applicableTo.includes(zoneId)) return;

      // Apply insulation
      setInsulatedZones((prev) => ({ ...prev, [zoneId]: selectedMaterial }));
      setLastInsulated({ zone: zoneId, material: selectedMaterial });

      // Animate rays out for this zone
      Animated.timing(rayOpacities[zoneId], {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Shield flash
      shieldFlash.setValue(1);
      Animated.timing(shieldFlash, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    },
    [selectedMaterial, insulatedZones, finished],
  );

  const handleFinish = useCallback(() => {
    if (finished) return;
    setFinished(true);

    // Score: points from materials used + bonus for reaching target temp
    const materialPoints = Object.values(insulatedZones).reduce(
      (sum, m) => sum + m.points,
      0,
    );
    const maxPoints = config
      ? config.activeZones.reduce((sum, zoneId) => {
          // Best material for each zone
          const best = availableMaterials
            .filter((m) => m.applicableTo.includes(zoneId))
            .reduce((mx, m) => Math.max(mx, m.points), 0);
          return sum + best;
        }, 0)
      : 1;
    const tempBonus = currentTemp <= (config?.targetTemp ?? 24) ? Math.round(maxPoints * 0.3) : 0;
    const score = materialPoints + tempBonus;
    const maxScore = Math.round(maxPoints * 1.3);

    const stars = completeLevel(levelId ?? '', score, maxScore);

    router.replace({
      pathname: '/level-complete',
      params: {
        levelId: levelId ?? '',
        stars: String(stars),
        score: String(score),
        maxScore: String(maxScore),
      },
    });
  }, [insulatedZones, currentTemp, config, levelId, finished, availableMaterials]);

  // --- Guard ---
  if (!level || !config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <GameButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const activeZoneSet = new Set(config.activeZones);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFE0B2', '#FFF8E1', '#E1F5FE']}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      <GameHeader
        title={level.title}
        subtitle={
          config.timeLimit
            ? `\u{23F1} ${timeLeft}s remaining`
            : `Zones: ${Object.keys(insulatedZones).length}/${config.activeZones.length}`
        }
        color={world?.color ?? '#E65100'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ====== SCENE ====== */}
        <View style={styles.scene}>

          {/* --- Sky gradient behind sun --- */}
          <LinearGradient
            colors={['#FFF9C4', '#FFF8E1', 'transparent']}
            style={styles.skyGlow}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* --- SUN --- */}
          <Animated.View style={[styles.sun, { transform: [{ scale: sunScale }] }]}>
            <View style={styles.sunGlow} />
            <Text style={styles.sunEmoji}>{'\u2600\uFE0F'}</Text>
          </Animated.View>

          {/* --- SUN RAYS --- */}
          {RAYS.filter((r) => activeZoneSet.has(r.zone)).map((r) => {
            const angle = rayAngle(r);
            const len = rayLength(r);
            return (
              <Animated.View
                key={r.id}
                style={[
                  styles.ray,
                  {
                    left: r.startX,
                    top: r.startY - 3,
                    width: len,
                    transform: [{ rotate: `${angle}deg` }],
                    opacity: rayOpacities[r.zone],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,200,0,0.7)', 'rgba(255,160,0,0.25)', 'rgba(255,120,0,0.08)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            );
          })}

          {/* --- HOUSE --- */}
          <View style={styles.house}>
            {/* Roof */}
            <View style={styles.houseRoof}>
              <View style={styles.roofTriangle} />
            </View>
            {/* Walls */}
            <View style={styles.houseWalls}>
              {/* Left wall – solid */}
              <View style={styles.wallLeft} />
              {/* Interior */}
              <View style={styles.houseInterior}>
                {/* People */}
                <View style={styles.peopleRow}>
                  <Text style={styles.personEmoji}>{mood.emoji}</Text>
                  <Text style={styles.personEmoji}>{mood.emoji}</Text>
                </View>
                <Text style={[styles.moodLabel, { color: mood.color }]}>
                  {mood.label}
                </Text>
                {/* Heat shimmer when hot */}
                {currentTemp >= 32 && (
                  <Text style={styles.heatWaves}>
                    {'\u{1F525}\u{1F525}\u{1F525}'}
                  </Text>
                )}
              </View>
              {/* Right wall area */}
              <View style={styles.wallRight} />
            </View>
            {/* Door */}
            <View style={styles.doorArea}>
              <View style={styles.door}>
                <Text style={styles.doorEmoji}>{'\u{1F6AA}'}</Text>
              </View>
            </View>
          </View>

          {/* --- INSULATION ZONES (tappable overlays) --- */}
          {ZONE_VISUALS.filter((z) => activeZoneSet.has(z.id)).map((zone) => {
            const isInsulated = !!insulatedZones[zone.id];
            const isCompatible =
              selectedMaterial &&
              !isInsulated &&
              selectedMaterial.applicableTo.includes(zone.id);

            return (
              <Pressable
                key={zone.id}
                onPress={() => handleZoneTap(zone.id)}
                style={[
                  styles.zone,
                  {
                    left: zone.left,
                    top: zone.top,
                    width: zone.width,
                    height: zone.height,
                  },
                ]}
              >
                {isInsulated ? (
                  // Insulated — green shield
                  <View style={styles.zoneInsulated}>
                    <Text style={styles.zoneInsulatedEmoji}>
                      {insulatedZones[zone.id].emoji}
                    </Text>
                    <Text style={styles.zoneInsulatedLabel}>
                      {'\u2705'} {insulatedZones[zone.id].name}
                    </Text>
                  </View>
                ) : (
                  // Not insulated — pulsing highlight
                  <Animated.View
                    style={[
                      styles.zoneActive,
                      isCompatible
                        ? styles.zoneCompatible
                        : styles.zoneWaiting,
                      { opacity: isCompatible ? 1 : zonePulse },
                    ]}
                  >
                    <Text style={styles.zoneLabel}>{zone.label}</Text>
                    <Text style={styles.zoneTapHint}>
                      {isCompatible ? 'TAP to insulate!' : 'Tap here!'}
                    </Text>
                  </Animated.View>
                )}
              </Pressable>
            );
          })}

          {/* --- THERMOMETER (left side) --- */}
          <View style={styles.thermoPosition}>
            <Thermometer temperature={currentTemp} />
          </View>

          {/* Shield flash overlay */}
          <Animated.View
            style={[styles.flashOverlay, { opacity: shieldFlash }]}
            pointerEvents="none"
          />
        </View>

        {/* ====== INFO PANEL ====== */}
        {lastInsulated && (
          <View style={[styles.infoPanel, Shadow.sm]}>
            <Text style={styles.infoPanelEmoji}>{lastInsulated.material.emoji}</Text>
            <View style={styles.infoPanelContent}>
              <Text style={styles.infoPanelTitle}>
                {lastInsulated.material.name} added to {lastInsulated.zone === 'roof' ? 'Roof' : lastInsulated.zone === 'right-wall' ? 'Right Wall' : 'Window'}!
              </Text>
              <Text style={styles.infoPanelDesc}>
                {lastInsulated.material.description}
              </Text>
              <Text style={styles.infoPanelEffect}>
                {'\u{1F321}\uFE0F'} Cooled by {lastInsulated.material.tempEffect}°C
              </Text>
            </View>
          </View>
        )}

        {/* ====== INSTRUCTION PANEL ====== */}
        {!allZonesInsulated && (
          <View style={[styles.instructionPanel, Shadow.sm]}>
            <Text style={styles.instructionEmoji}>{'\u{1F9F1}'}</Text>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>
                Tap the glowing zones on the house to add insulation!
              </Text>
              <Text style={styles.instructionDesc}>
                Insulation blocks the sun{'\u2019'}s heat rays from entering. Each layer cools the house by {availableMaterials[0]?.tempEffect ?? 6}°C.
              </Text>
            </View>
          </View>
        )}

        {/* ====== DONE BUTTON ====== */}
        {allZonesInsulated && !finished && (
          <View style={styles.doneArea}>
            <View style={[styles.successCard, Shadow.lg]}>
              <Text style={styles.successEmoji}>{'\u{1F389}'}</Text>
              <Text style={styles.successTitle}>House insulated!</Text>
              <Text style={styles.successDesc}>
                Temperature dropped from {startTemp}°C to {currentTemp}°C.
                {currentTemp <= (config.targetTemp ?? 24)
                  ? ' The people inside feel great!'
                  : ' Good effort, but it could be cooler!'}
              </Text>
              <GameButton
                title="See Results"
                emoji={'\u{2B50}'}
                onPress={handleFinish}
                color={GameColors.primary}
                size="lg"
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const HOUSE_LEFT = SCENE_W * 0.1;
const HOUSE_TOP = 90;
const HOUSE_W = SCENE_W * 0.6;
const HOUSE_H = 260;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // ---- SCENE ----
  scene: {
    width: SCENE_W,
    height: SCENE_H,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: '#E3F2FD',
  },
  skyGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: SCENE_W * 0.5,
    height: SCENE_H * 0.45,
    borderBottomLeftRadius: 200,
  },

  // ---- SUN ----
  sun: {
    position: 'absolute',
    right: SCENE_W * 0.06,
    top: 8,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sunGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,235,59,0.3)',
  },
  sunEmoji: {
    fontSize: 52,
  },

  // ---- RAYS ----
  ray: {
    position: 'absolute',
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    transformOrigin: 'left center',
    zIndex: 5,
  },

  // ---- HOUSE ----
  house: {
    position: 'absolute',
    left: HOUSE_LEFT,
    top: HOUSE_TOP,
    width: HOUSE_W,
    height: HOUSE_H,
    zIndex: 3,
  },
  houseRoof: {
    height: 55,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roofTriangle: {
    width: '110%',
    height: 55,
    backgroundColor: '#A1887F',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderTopWidth: 0,
    // Simulate a roof shape
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  houseWalls: {
    flex: 1,
    flexDirection: 'row',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  wallLeft: {
    width: 14,
    backgroundColor: '#BCAAA4',
  },
  houseInterior: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  wallRight: {
    width: 14,
    backgroundColor: '#BCAAA4',
  },
  peopleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  personEmoji: {
    fontSize: 44,
  },
  moodLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  heatWaves: {
    fontSize: 20,
    marginTop: 2,
  },
  doorArea: {
    height: 0,
    alignItems: 'center',
  },
  door: {
    width: 34,
    height: 48,
    backgroundColor: '#6D4C41',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -48,
  },
  doorEmoji: { fontSize: 16 },

  // ---- ZONES ----
  zone: {
    position: 'absolute',
    zIndex: 15,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  zoneActive: {
    flex: 1,
    borderWidth: 3,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  zoneWaiting: {
    borderColor: 'rgba(255,152,0,0.7)',
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderStyle: 'dashed',
  },
  zoneCompatible: {
    borderColor: '#66BB6A',
    backgroundColor: 'rgba(102,187,106,0.2)',
    borderStyle: 'solid',
  },
  zoneLabel: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: '#E65100',
    textAlign: 'center',
  },
  zoneTapHint: {
    fontFamily: Fonts.rounded,
    fontSize: 9,
    fontWeight: '700',
    color: GameColors.textSecondary,
    textAlign: 'center',
  },
  zoneInsulated: {
    flex: 1,
    backgroundColor: 'rgba(76,175,80,0.25)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  zoneInsulatedEmoji: {
    fontSize: 22,
  },
  zoneInsulatedLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 8,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },

  // ---- THERMOMETER ----
  thermoPosition: {
    position: 'absolute',
    left: 4,
    top: 60,
    zIndex: 20,
  },

  // Flash overlay
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(102,187,106,0.15)',
    zIndex: 25,
  },

  // ---- INFO PANEL ----
  infoPanel: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  infoPanelEmoji: { fontSize: 34 },
  infoPanelContent: { flex: 1 },
  infoPanelTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: GameColors.textPrimary,
  },
  infoPanelDesc: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  infoPanelEffect: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: GameColors.water,
    marginTop: 4,
  },

  // ---- INSTRUCTION PANEL ----
  instructionPanel: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  instructionEmoji: { fontSize: 34 },
  instructionContent: { flex: 1 },
  instructionTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#E65100',
  },
  instructionDesc: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.sm,
    color: GameColors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },

  // ---- DONE ----
  doneArea: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  successEmoji: { fontSize: 48 },
  successTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.xl,
    fontWeight: '900',
    color: GameColors.primaryDark,
  },
  successDesc: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.md,
    color: GameColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    color: GameColors.textMuted,
  },
});
