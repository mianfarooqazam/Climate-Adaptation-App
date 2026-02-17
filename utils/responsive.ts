/**
 * Responsive layout helpers for mobile and tablet.
 * Keeps UI from breaking on different screen sizes and orientations.
 */

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Reference dimensions (design base: medium phone in landscape / tablet)
const BASE_WIDTH = 768;
const BASE_HEIGHT = 1024;
const TABLET_BREAKPOINT = 600;

/**
 * Scale a value by screen width so layout doesn't overflow on small devices.
 * Use for font sizes, fixed paddings, and icon sizes that should adapt.
 */
export function scaleByWidth(value: number, width: number): number {
  const ratio = width / BASE_WIDTH;
  const scale = Math.min(Math.max(ratio, 0.7), 1.3);
  return Math.round(value * scale);
}

/**
 * Scale a value by screen height (e.g. for vertical spacing or heights).
 */
export function scaleByHeight(value: number, height: number): number {
  const ratio = height / BASE_HEIGHT;
  const scale = Math.min(Math.max(ratio, 0.7), 1.2);
  return Math.round(value * scale);
}

/**
 * Hook: current window dimensions, safe area insets, and responsive helpers.
 * Use in screens so layout updates on rotation and fits notches.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  const isSmallPhone = Math.min(width, height) < 400;

  const scale = (v: number) => scaleByWidth(v, width);
  const scaleV = (v: number) => scaleByHeight(v, height);

  // Scale factor for game canvases: keep proportions on small screens
  const gameScale = Math.min(1, width / BASE_WIDTH, height / BASE_HEIGHT);
  const gameScaleClamped = Math.max(0.5, Math.min(1, gameScale));

  return {
    width,
    height,
    insets,
    isTablet,
    isSmallPhone,
    scale,
    scaleV,
    gameScale: gameScaleClamped,
  };
}
