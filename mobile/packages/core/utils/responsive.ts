import { useWindowDimensions, PixelRatio, Platform, Dimensions } from 'react-native';
import { useMemo } from 'react';

export const BREAKPOINTS = {
  phone: 0,
  phoneWide: 480,
  tablet: 768,
  tabletWide: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.tabletWide) return 'tabletWide';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.phoneWide) return 'phoneWide';
  return 'phone';
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return useMemo(() => getBreakpoint(width), [width]);
}

export function getResponsiveValue<T>(
  width: number,
  values: {
    phone: T;
    phoneWide?: T;
    tablet?: T;
    tabletWide?: T;
  }
): T {
  const breakpoint = getBreakpoint(width);
  
  if (breakpoint === 'tabletWide' && values.tabletWide !== undefined) {
    return values.tabletWide;
  }
  if ((breakpoint === 'tabletWide' || breakpoint === 'tablet') && values.tablet !== undefined) {
    return values.tablet;
  }
  if ((breakpoint === 'tabletWide' || breakpoint === 'tablet' || breakpoint === 'phoneWide') && values.phoneWide !== undefined) {
    return values.phoneWide;
  }
  return values.phone;
}

export function useResponsiveValue<T>(values: {
  phone: T;
  phoneWide?: T;
  tablet?: T;
  tabletWide?: T;
}): T {
  const { width } = useWindowDimensions();
  return useMemo(() => getResponsiveValue(width, values), [width, values.phone, values.phoneWide, values.tablet, values.tabletWide]);
}

export function useScreenDimensions() {
  const { width, height } = useWindowDimensions();
  
  return useMemo(() => {
    const breakpoint = getBreakpoint(width);
    return {
      width,
      height,
      breakpoint,
      isPhone: breakpoint === 'phone' || breakpoint === 'phoneWide',
      isTablet: breakpoint === 'tablet' || breakpoint === 'tabletWide',
      isLandscape: width > height,
      isPortrait: height >= width,
    };
  }, [width, height]);
}

export function useResponsiveStyles<T extends Record<string, any>>(
  baseStyles: T,
  responsiveOverrides?: {
    phoneWide?: Partial<T>;
    tablet?: Partial<T>;
    tabletWide?: Partial<T>;
  }
): T {
  const { width } = useWindowDimensions();
  
  return useMemo(() => {
    const breakpoint = getBreakpoint(width);
    let styles = { ...baseStyles };
    
    if (breakpoint !== 'phone' && responsiveOverrides?.phoneWide) {
      styles = { ...styles, ...responsiveOverrides.phoneWide };
    }
    if ((breakpoint === 'tablet' || breakpoint === 'tabletWide') && responsiveOverrides?.tablet) {
      styles = { ...styles, ...responsiveOverrides.tablet };
    }
    if (breakpoint === 'tabletWide' && responsiveOverrides?.tabletWide) {
      styles = { ...styles, ...responsiveOverrides.tabletWide };
    }
    
    return styles;
  }, [width, baseStyles, responsiveOverrides]);
}

const BASE_WIDTH = 375;

export function wp(widthPercent: number, screenWidth?: number): number {
  const width = screenWidth ?? Dimensions.get('window').width;
  return PixelRatio.roundToNearestPixel((width * widthPercent) / 100);
}

export function hp(heightPercent: number, screenHeight?: number): number {
  const height = screenHeight ?? Dimensions.get('window').height;
  return PixelRatio.roundToNearestPixel((height * heightPercent) / 100);
}

export function useWp(widthPercent: number): number {
  const { width } = useWindowDimensions();
  return useMemo(() => PixelRatio.roundToNearestPixel((width * widthPercent) / 100), [width, widthPercent]);
}

export function useHp(heightPercent: number): number {
  const { height } = useWindowDimensions();
  return useMemo(() => PixelRatio.roundToNearestPixel((height * heightPercent) / 100), [height, heightPercent]);
}

export function getScaledSize(baseSize: number, screenWidth?: number): number {
  const width = screenWidth ?? Dimensions.get('window').width;
  const scale = width / BASE_WIDTH;
  const maxScale = 1.3;
  const minScale = 0.8;
  const clampedScale = Math.min(Math.max(scale, minScale), maxScale);
  return Math.round(baseSize * clampedScale);
}

export function useScaledSize(baseSize: number): number {
  const { width } = useWindowDimensions();
  return useMemo(() => getScaledSize(baseSize, width), [baseSize, width]);
}

export function getFontScale(screenWidth?: number): number {
  const width = screenWidth ?? Dimensions.get('window').width;
  if (width >= BREAKPOINTS.tabletWide) return 1.2;
  if (width >= BREAKPOINTS.tablet) return 1.1;
  return 1.0;
}

export function useFontScale(): number {
  const { width } = useWindowDimensions();
  return useMemo(() => getFontScale(width), [width]);
}

export function useGridColumns(options?: {
  phone?: number;
  phoneWide?: number;
  tablet?: number;
  tabletWide?: number;
}): number {
  const defaults = {
    phone: 1,
    phoneWide: 2,
    tablet: 3,
    tabletWide: 4,
    ...options,
  };
  
  return useResponsiveValue(defaults);
}

export function getCardWidth(
  screenWidth: number,
  columns: number,
  horizontalPadding: number = 16,
  gap: number = 12
): number {
  const totalGaps = gap * (columns - 1);
  const totalPadding = horizontalPadding * 2;
  const availableWidth = screenWidth - totalPadding - totalGaps;
  return Math.floor(availableWidth / columns);
}

export function useCardWidth(columns: number, horizontalPadding: number = 16, gap: number = 12): number {
  const { width } = useWindowDimensions();
  return useMemo(() => getCardWidth(width, columns, horizontalPadding, gap), [width, columns, horizontalPadding, gap]);
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  heading2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  heading3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const;

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
} as const;

export default {
  BREAKPOINTS,
  getBreakpoint,
  useBreakpoint,
  getResponsiveValue,
  useResponsiveValue,
  useScreenDimensions,
  useResponsiveStyles,
  wp,
  hp,
  useWp,
  useHp,
  getScaledSize,
  useScaledSize,
  getFontScale,
  useFontScale,
  useGridColumns,
  getCardWidth,
  useCardWidth,
  spacing,
  typography,
  shadows,
};
