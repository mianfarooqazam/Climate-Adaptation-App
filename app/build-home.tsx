/**
 * EcoHero: Flood Fighters — Build Your Home (3D Explore)
 *
 * When the "Build your home" world level is pressed, this screen shows a 3D
 * scene (React Native Filament when native module is available) with a person
 * that can be moved using an on-screen joystick. In Expo Go, a 2D fallback is used.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  TurboModuleRegistry,
} from 'react-native';

import GameButton from '@/components/game/GameButton';
import LanguageToggle from '@/components/game/LanguageToggle';
import { getLevelById } from '@/constants/gameData';
import { FontSizes, Fonts, GameColors, Spacing } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

const { width: SCR_W, height: SCR_H } = Dimensions.get('window');
const HEADER_H = 48;
const JOYSTICK_SIZE = 120;
const JOYSTICK_THUMB_R = 28;
const MOVE_SPEED = 4;
const FALLBACK_MOVE_SPEED = 120; // px/s for 2D fallback

// ---------------------------------------------------------------------------
// Joystick
// ---------------------------------------------------------------------------

function Joystick({
  onMove,
  onEnd,
}: {
  onMove: (dx: number, dz: number) => void;
  onEnd: () => void;
}) {
  const [thumbX, setThumbX] = useState(0);
  const [thumbY, setThumbY] = useState(0);
  const center = JOYSTICK_SIZE / 2;
  const maxR = center - JOYSTICK_THUMB_R - 4;

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, g) => {
      const dx = g.dx;
      const dy = g.dy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const clampedR = Math.min(r, maxR);
      const sx = Math.cos(angle) * clampedR;
      const sy = Math.sin(angle) * clampedR;
      setThumbX(sx);
      setThumbY(sy);
      const nz = -sy / maxR;
      const nx = sx / maxR;
      onMove(nx, nz);
    },
    onPanResponderRelease: () => {
      setThumbX(0);
      setThumbY(0);
      onMove(0, 0);
      onEnd();
    },
  });

  return (
    <View style={styles.joystickContainer} {...pan.panHandlers}>
      <View style={styles.joystickBase}>
        <View
          style={[
            styles.joystickThumb,
            {
              transform: [
                { translateX: thumbX },
                { translateY: thumbY },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2D fallback when Filament native module is not available (Expo Go)
// ---------------------------------------------------------------------------

const IMAGE_SIZE = 48;

function FallbackScene({
  playerX,
  playerZ,
}: {
  playerX: number;
  playerZ: number;
}) {
  const centerX = SCR_W / 2;
  const centerY = SCR_H / 2;
  const scale = 50;
  const x = centerX + playerX * scale;
  const y = centerY - playerZ * scale;

  return (
    <View style={styles.fallbackScene}>
      <View style={styles.fallbackGround} />
      <Image
        source={require('@/assets/images/icon.png')}
        style={[
          styles.fallbackImage,
          {
            left: x - IMAGE_SIZE / 2,
            top: y - IMAGE_SIZE,
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BuildHomeScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { t } = useLanguage();
  const level = getLevelById(levelId ?? '');
  const { recordLevelComplete } = useGame();

  const [playerX, setPlayerX] = useState(0);
  const [playerZ, setPlayerZ] = useState(0);
  const [SceneComponent, setSceneComponent] = useState<React.ComponentType<{ playerX: number; playerZ: number }> | null | 'fallback'>(null);
  const joystickRef = useRef({ dx: 0, dz: 0 });
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const onJoystickMove = useCallback((nx: number, nz: number) => {
    joystickRef.current = { dx: nx, dz: nz };
  }, []);

  const onJoystickEnd = useCallback(() => {}, []);

  // Load Filament scene only when Worklets native module exists (dev build).
  // Never import BuildHomeScene in Expo Go so we avoid the Worklets crash.
  useEffect(() => {
    let cancelled = false;
    const worklets = TurboModuleRegistry?.get('Worklets');
    if (worklets != null) {
      import('@/components/build-home/BuildHomeScene')
        .then((m) => {
          if (!cancelled) setSceneComponent(() => m.default);
        })
        .catch(() => {
          if (!cancelled) setSceneComponent('fallback');
        });
    } else {
      setSceneComponent('fallback');
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Game loop: apply joystick to position
  useEffect(() => {
    const speed = SceneComponent && SceneComponent !== 'fallback' ? MOVE_SPEED : FALLBACK_MOVE_SPEED / 40;
    const tick = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;
      const { dx, dz } = joystickRef.current;
      if (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02) {
        setPlayerX((x) => x + dx * speed * dt);
        setPlayerZ((z) => z + dz * speed * dt);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [SceneComponent]);

  const handleComplete = useCallback(() => {
    if (level) {
      recordLevelComplete(level.id, 3, 1, 1);
      router.replace({
        pathname: '/level-complete',
        params: {
          levelId: level.id,
          stars: '3',
          score: '1',
          maxScore: '1',
        },
      });
    }
  }, [level, recordLevelComplete, router]);

  const goBack = () => router.back();

  const SceneContent =
    SceneComponent && SceneComponent !== 'fallback' ? (
      <SceneComponent playerX={playerX} playerZ={playerZ} />
    ) : SceneComponent === 'fallback' ? (
      <FallbackScene playerX={playerX} playerZ={playerZ} />
    ) : (
      <View style={styles.loadingScene}>
        <Text style={styles.loadingText}>{t('buildHomeExplore')}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {SceneContent}

      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {level?.title ?? t('buildHomeExplore')}
          </Text>
        </View>
        <LanguageToggle />
      </View>

      <Joystick onMove={onJoystickMove} onEnd={onJoystickEnd} />

      <View style={styles.footer}>
        <GameButton
          title={t('completeBuildHome')}
          emoji={'\u{1F3E0}'}
          onPress={handleComplete}
          color={GameColors.primary}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  loadingScene: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#87CEEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    color: '#fff',
  },
  fallbackScene: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#87CEEB',
  },
  fallbackGround: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: '#8BC34A',
  },
  fallbackImage: {
    position: 'absolute',
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.rounded,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#fff',
  },
  joystickContainer: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickThumb: {
    position: 'absolute',
    width: JOYSTICK_THUMB_R * 2,
    height: JOYSTICK_THUMB_R * 2,
    borderRadius: JOYSTICK_THUMB_R,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
