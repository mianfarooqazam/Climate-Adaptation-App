/**
 * Shared for Strategic Landscaping game:
 * - Tree: View-based tree (trunk + foliage), bigger and proper graphics
 * - LandscapingHouse: Same 3D house as insulation/windows, with scale and mood
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts, FontSizes } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Tree — trunk + foliage (no emoji), big
// ---------------------------------------------------------------------------

const TRUNK_W = 28;
const TRUNK_H = 52;
const FOLIAGE_R = 42;
const TREE_W = FOLIAGE_R * 2.2;
const TREE_H = TRUNK_H + FOLIAGE_R * 1.5;

export function Tree({ size = 1, style }: { size?: number; style?: any }) {
  const s = size;
  const tw = TREE_W * s;
  const th = TREE_H * s;
  return (
    <View style={[treeStyles.wrap, { width: tw, height: th }, style]}>
      {/* Trunk */}
      <View style={[treeStyles.trunk, { width: TRUNK_W * s, height: TRUNK_H * s, bottom: 0 }]} />
      {/* Foliage: overlapping circles for full crown */}
      <View style={[treeStyles.foliageWrap, { width: tw, height: FOLIAGE_R * 1.6 * s, bottom: (TRUNK_H - 8) * s }]}>
        <View style={[treeStyles.foliage, treeStyles.foliageBack, { width: FOLIAGE_R * 2 * s, height: FOLIAGE_R * 1.4 * s, borderRadius: FOLIAGE_R * s, left: (tw - FOLIAGE_R * 2 * s) / 2 }]} />
        <View style={[treeStyles.foliage, treeStyles.foliageMid, { width: FOLIAGE_R * 1.7 * s, height: FOLIAGE_R * 1.35 * s, borderRadius: FOLIAGE_R * 0.85 * s, left: (tw - FOLIAGE_R * 1.7 * s) / 2, top: 6 * s }]} />
        <View style={[treeStyles.foliage, treeStyles.foliageFront, { width: FOLIAGE_R * 1.45 * s, height: FOLIAGE_R * 1.25 * s, borderRadius: FOLIAGE_R * 0.72 * s, left: (tw - FOLIAGE_R * 1.45 * s) / 2, top: 12 * s }]} />
      </View>
    </View>
  );
}

const treeStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  trunk: {
    position: 'absolute',
    backgroundColor: '#5D4037',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  foliageWrap: { position: 'absolute', left: 0, alignItems: 'center' },
  foliage: { position: 'absolute' },
  foliageBack: { backgroundColor: '#1B5E20' },
  foliageMid: { backgroundColor: '#2E7D32' },
  foliageFront: { backgroundColor: '#43A047' },
});

// ---------------------------------------------------------------------------
// Mood (same as windows/insulation)
// ---------------------------------------------------------------------------

export interface Mood {
  label: string;
  bg: string;
  skin: string;
  cheek: string;
  mouth: 'frown' | 'neutral' | 'smile' | 'grin';
  sweat: boolean;
  eyeStyle: 'squint' | 'normal' | 'happy';
}

export const moodHot: Mood = {
  label: '',
  bg: '#FFCDD2',
  skin: '#FFAB91',
  cheek: '#EF5350',
  mouth: 'frown',
  sweat: true,
  eyeStyle: 'squint',
};

export const moodCool: Mood = {
  label: '',
  bg: '#BBDEFB',
  skin: '#FFCCBC',
  cheek: '#EF9A9A',
  mouth: 'grin',
  sweat: false,
  eyeStyle: 'happy',
};

// ---------------------------------------------------------------------------
// CartoonPerson (same as windows/insulation)
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

export function CartoonPerson({ m, shirt, pants, hair, isChild, isFemale, hairBow }: PersonProps) {
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
        <View style={{ flexDirection: 'row', gap: h(14), marginTop: h(1) }}>
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
          <View style={{ width: h(6), height: h(4), borderRadius: h(3), backgroundColor: m.cheek, opacity: 0.5 }} />
        </View>
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
        {m.sweat && (
          <View style={{ position: 'absolute', right: -h(2), top: h(6), width: h(6), height: h(9), borderRadius: h(3), backgroundColor: '#64B5F6' }} />
        )}
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
// LandscapingHouse — same 3D house as windows/insulation, scaled
// ---------------------------------------------------------------------------

const ROOF_H = 35;
const ROOF_OVERHANG = 12;
const WALL_H = 75;
const H_W = 180;
const H_H = ROOF_H + WALL_H + 14;
const SIDE_D = 25;

export function LandscapingHouse({
  left,
  top,
  scale = 1,
  mood,
  moodLabel,
}: {
  left: number;
  top: number;
  scale?: number;
  mood: Mood;
  moodLabel: string;
}) {
  const z = scale;
  return (
    <View style={{ position: 'absolute', left, top, width: (H_W + SIDE_D + 10) * z, height: (H_H + 30) * z, zIndex: 3 }}>
      <View style={[houseStyles.groundShadow, { left: 10 * z, top: (H_H + 4) * z, width: (H_W + SIDE_D - 10) * z, height: 18 * z, borderRadius: 100 }]} />
      <View style={[houseStyles.sideWall, { left: H_W * z, top: ROOF_H * z, width: SIDE_D * z, height: WALL_H * z }]} />
      <View style={[houseStyles.chimney, { left: H_W * 0.17 * z, top: -28 * z }]}>
        <View style={[houseStyles.chimneyTop, { width: 32 * z, height: 8 * z, borderRadius: 3 }]} />
        <View style={[houseStyles.chimneyFront, { width: 24 * z, height: 34 * z, marginLeft: 4 * z }]} />
      </View>
      <View style={[houseStyles.frontRoof, { left: (-ROOF_OVERHANG / 2) * z, width: (H_W + ROOF_OVERHANG) * z, height: ROOF_H * z }]}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: ((H_W + ROOF_OVERHANG) / 2) * z,
            borderRightWidth: ((H_W + ROOF_OVERHANG) / 2) * z,
            borderBottomWidth: ROOF_H * z,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#8D6E63',
            borderStyle: 'solid',
          }}
        />
      </View>
      <View style={[houseStyles.frontWalls, { left: 0, top: ROOF_H * z, width: H_W * z, height: WALL_H * z }]}>
        <View style={[houseStyles.wallPanel, { width: 28 * z }]}>
          {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
            <View key={i} style={[houseStyles.brickRow, i % 2 === 1 && { paddingLeft: 12 * z }]}>
              {Array.from({ length: 6 }).map((__, j) => (
                <View key={j} style={[houseStyles.brick, { width: 22 * z, height: 14 * z }]} />
              ))}
            </View>
          ))}
        </View>
        <View style={[houseStyles.interior, { backgroundColor: mood.bg }]}>
          <View style={[houseStyles.floorLine, { height: 4 * z }]} />
          <View style={[houseStyles.table, { bottom: 8 * z, right: 20 * z }]}>
            <View style={[houseStyles.tableTop, { width: 36 * z, height: 6 * z }]} />
            <View style={[houseStyles.tableLeg, { width: 4 * z, height: 18 * z }]} />
          </View>
          <View style={[houseStyles.decoWindowL, { left: 14 * z, top: 18 * z, width: 42 * z, height: 42 * z }]}>
            <View style={houseStyles.decoWindowPane} />
            <View style={houseStyles.decoWindowCross} />
            <View style={houseStyles.decoWindowCrossH} />
          </View>
          <View style={[houseStyles.peopleRow, { gap: 6 * z }]}>
            <CartoonPerson m={mood} shirt="#42A5F5" pants="#1565C0" hair="#5D4037" />
            <CartoonPerson m={mood} shirt="#EC407A" pants="#880E4F" hair="#3E2723" isFemale />
            <CartoonPerson m={mood} shirt="#66BB6A" pants="#33691E" hair="#4E342E" isChild />
            <CartoonPerson m={mood} shirt="#FFB74D" pants="#E91E63" hair="#5D4037" isChild isFemale hairBow="#FF4081" />
          </View>
          <Text style={[houseStyles.moodLabel, { color: mood.bg === '#BBDEFB' ? '#1565C0' : mood.bg === '#FFCDD2' ? '#C62828' : '#E65100' }]}>
            {moodLabel}
          </Text>
        </View>
        <View style={[houseStyles.wallPanelR, { width: 16 * z }]}>
          {Array.from({ length: Math.floor(WALL_H / 18) }).map((_, i) => (
            <View key={i} style={[houseStyles.brickRow, i % 2 === 1 && { paddingLeft: 10 * z }]}>
              <View style={[houseStyles.brick, { width: 22 * z, height: 14 * z }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={[houseStyles.doorWrap, { left: (H_W / 2 - 22) * z, top: (H_H - 72) * z }]}>
        <View style={[houseStyles.door, { width: 40 * z, height: 58 * z }]}>
          <View style={[houseStyles.doorInner, { width: 32 * z, height: 44 * z }]}>
            <View style={[houseStyles.doorKnob, { width: 6 * z, height: 6 * z, borderRadius: 3 * z }]} />
          </View>
        </View>
        <View style={[houseStyles.doorStep, { width: 52 * z, height: 8 * z }]} />
      </View>
      <View style={[houseStyles.foundation, { left: 0, top: (H_H - 14) * z, width: H_W * z, height: 10 * z }]} />
    </View>
  );
}

const houseStyles = StyleSheet.create({
  groundShadow: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.12)', zIndex: 0 },
  sideWall: { position: 'absolute', backgroundColor: '#B3E5FC', borderRightWidth: 3, borderBottomWidth: 2, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#5D4037', borderRadius: 2 },
  chimney: { position: 'absolute', zIndex: 5 },
  chimneyTop: { backgroundColor: '#5D4037', zIndex: 2 },
  chimneyFront: { backgroundColor: '#795548', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  frontRoof: { position: 'absolute', left: 0, alignItems: 'center', zIndex: 2 },
  frontWalls: { position: 'absolute', flexDirection: 'row', overflow: 'hidden', borderBottomLeftRadius: 3, zIndex: 2 },
  wallPanel: { backgroundColor: '#D7CCC8', overflow: 'hidden' },
  wallPanelR: { backgroundColor: '#D7CCC8', overflow: 'hidden' },
  brickRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  brick: { backgroundColor: '#BCAAA4', borderRadius: 2, borderWidth: 1, borderColor: '#A1887F' },
  interior: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  floorLine: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#8D6E63' },
  table: { position: 'absolute', alignItems: 'center' },
  tableTop: { backgroundColor: '#8D6E63', borderRadius: 2 },
  tableLeg: { backgroundColor: '#6D4C41' },
  decoWindowL: { position: 'absolute', backgroundColor: '#B3E5FC', borderRadius: 4, borderWidth: 3, borderColor: '#8D6E63', overflow: 'hidden' },
  decoWindowPane: { ...StyleSheet.absoluteFillObject, backgroundColor: '#B3E5FC' },
  decoWindowCross: { position: 'absolute', left: '48%', top: 0, bottom: 0, width: 3, backgroundColor: '#8D6E63' },
  decoWindowCrossH: { position: 'absolute', top: '48%', left: 0, right: 0, height: 3, backgroundColor: '#8D6E63' },
  peopleRow: { flexDirection: 'row', zIndex: 2, alignItems: 'flex-end', justifyContent: 'center' },
  moodLabel: { fontFamily: Fonts.rounded, fontSize: FontSizes.sm, fontWeight: '800', zIndex: 2, marginTop: 2 },
  doorWrap: { position: 'absolute', alignItems: 'center', zIndex: 3 },
  door: { backgroundColor: '#5D4037', borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, overflow: 'hidden' },
  doorInner: { backgroundColor: '#4E342E', borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 },
  doorKnob: { backgroundColor: '#FFD54F' },
  doorStep: { backgroundColor: '#78909C', borderRadius: 2, marginTop: 1 },
  foundation: { position: 'absolute', backgroundColor: '#78909C', borderRadius: 2, zIndex: 2 },
});
