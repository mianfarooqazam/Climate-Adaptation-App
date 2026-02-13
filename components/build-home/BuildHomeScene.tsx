/**
 * 3D Filament scene for Build Your Home.
 * Loaded only when native Worklets/Filament are available (dev build).
 * Lives outside app/ so Expo Router does not load it as a route.
 */

import {
  Camera,
  DebugBox,
  DefaultLight,
  FilamentScene,
  FilamentView,
} from 'react-native-filament';
import React from 'react';
import { StyleSheet } from 'react-native';

const CAMERA_HEIGHT = 3;
const CAMERA_DISTANCE = 6;

export type BuildHomeSceneProps = {
  playerX: number;
  playerZ: number;
};

export default function BuildHomeScene({ playerX, playerZ }: BuildHomeSceneProps) {
  return (
    <FilamentScene style={StyleSheet.absoluteFill}>
      <FilamentView style={styles.filamentView}>
        <DefaultLight />
        <Camera
          cameraPosition={[
            playerX,
            CAMERA_HEIGHT,
            playerZ + CAMERA_DISTANCE,
          ]}
          cameraTarget={[playerX, 0.5, playerZ]}
          cameraUp={[0, 1, 0]}
        />
        {/* Ground */}
        <DebugBox
          translate={[0, -0.2, 0]}
          scale={[20, 0.1, 20]}
          multiplyWithCurrentTransform={false}
        />
        {/* Character: body */}
        <DebugBox
          translate={[playerX, 0.5, playerZ]}
          scale={[0.35, 0.9, 0.2]}
          multiplyWithCurrentTransform={false}
        />
        {/* Character: head */}
        <DebugBox
          translate={[playerX, 1.35, playerZ]}
          scale={[0.28, 0.28, 0.28]}
          multiplyWithCurrentTransform={false}
        />
      </FilamentView>
    </FilamentScene>
  );
}

const styles = StyleSheet.create({
  filamentView: { flex: 1 },
});
