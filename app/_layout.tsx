/**
 * EcoHero: Flood Fighters — Root Layout
 *
 * Wraps the entire app in the GameProvider for global state.
 * Uses a Stack navigator with no headers (each screen handles its own).
 * SafeAreaProvider ensures content respects notches on mobile/tablet.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from '@/context/GameContext';
import { LanguageProvider } from '@/context/LanguageContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <GameProvider>
          <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#E8F5E9' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="intro-conversation" />
          <Stack.Screen name="world-map" />
          <Stack.Screen name="levels" />
          <Stack.Screen name="quiz" />
          <Stack.Screen name="flood-defense" />
          <Stack.Screen name="eco-builder" />
          <Stack.Screen name="sorting" />
          <Stack.Screen name="insulation-game" />
          <Stack.Screen name="windows-game" />
          <Stack.Screen name="roof-garden-game" />
          <Stack.Screen name="build-home" />
          <Stack.Screen
            name="level-complete"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="profile" />
          </Stack>
          <StatusBar style="auto" />
        </GameProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
