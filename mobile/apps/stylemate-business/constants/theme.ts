export const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  violet: '#8B5CF6',
  fuchsia: '#D946EF',
  green: '#22C55E',
  greenLight: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
  pink: '#EC4899',
  cyan: '#06B6D4',
  orange: '#F97316',
  purple: '#A855F7',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  textOnGradient: 'rgba(255, 255, 255, 0.8)',
} as const;

export const GRADIENTS = {
  primary: [COLORS.violet, COLORS.fuchsia] as [string, string],
  success: [COLORS.green, COLORS.greenLight] as [string, string],
  warning: [COLORS.amber, COLORS.orange] as [string, string],
  info: [COLORS.blue, COLORS.cyan] as [string, string],
  danger: [COLORS.red, COLORS.pink] as [string, string],
  disabled: [COLORS.cardBorder, COLORS.cardBorder] as [string, string],
} as const;

export const SPACING = {
  micro: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const SIZES = {
  iconSmall: 18,
  iconMedium: 32,
  iconLarge: 40,
  iconXLarge: 48,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
  buttonSmall: 32,
  buttonMedium: 40,
  buttonLarge: 48,
  inputHeight: 48,
  listPaddingBottom: 120,
  emojiLarge: 64,
  placeholderWidth: 100,
} as const;

export type ColorKey = keyof typeof COLORS;
export type GradientKey = keyof typeof GRADIENTS;
