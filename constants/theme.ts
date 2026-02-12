/**
 * EcoHero: Flood Fighters — Theme Constants
 *
 * Cartoon-style colour palette designed for children 8–14.
 * Bright, high-contrast colours with rounded, playful typography.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

export const GameColors = {
  // Primary
  primary: '#2E7D32',        // deep green
  primaryLight: '#4CAF50',   // vibrant green
  primaryDark: '#1B5E20',    // dark green

  // Accents
  water: '#1E88E5',          // flood / water blue
  waterLight: '#64B5F6',
  sun: '#FFC107',            // golden yellow
  sunLight: '#FFE082',
  earth: '#795548',          // earthy brown
  danger: '#EF5350',         // alert / wrong answer red
  dangerLight: '#EF9A9A',

  // Backgrounds
  bgLight: '#E8F5E9',        // soft green tint
  bgCard: '#FFFFFF',
  bgOverlay: 'rgba(0,0,0,0.4)',

  // Neutrals
  textPrimary: '#1B5E20',
  textSecondary: '#4E6E50',
  textLight: '#FFFFFF',
  textMuted: '#90A4AE',
  border: '#C8E6C9',

  // Status
  correct: '#66BB6A',
  incorrect: '#EF5350',
  locked: '#B0BEC5',
  star: '#FFD600',
  starEmpty: '#E0E0E0',

  // World colours
  world1: '#1E88E5',
  world2: '#43A047',
  world3: '#FF8F00',
  world4: '#8E24AA',
};

// ---------------------------------------------------------------------------
// Spacing & sizing
// ---------------------------------------------------------------------------

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  round: 999,
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Consolas, monospace",
  },
})!;

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  title: 42,
};

// ---------------------------------------------------------------------------
// Shadows (iOS + Android)
// ---------------------------------------------------------------------------

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Keep a re-export for back-compat if other files import Colors
export const Colors = {
  light: {
    text: GameColors.textPrimary,
    background: GameColors.bgLight,
    tint: GameColors.primary,
    icon: GameColors.textSecondary,
    tabIconDefault: GameColors.textMuted,
    tabIconSelected: GameColors.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};
