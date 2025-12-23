export type StatusBarStyle = 'dark-content' | 'light-content';

export interface Theme {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  overlay: string;
  overlayLight: string;
  card: string;
  cardBorder: string;
  input: string;
  inputBorder: string;
  inputFocusBorder: string;
  inputPlaceholder: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  skeleton: string;
  skeletonHighlight: string;
  statusBar: StatusBarStyle;
}

export type ThemeColor = keyof Theme;

export const lightTheme: Theme = {
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  surface: '#F5F5F5',
  surfaceElevated: '#FFFFFF',
  
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',
  
  accent: '#06B6D4',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  
  input: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputFocusBorder: '#8B5CF6',
  inputPlaceholder: '#9CA3AF',
  
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabBarActive: '#8B5CF6',
  tabBarInactive: '#9CA3AF',
  
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  
  statusBar: 'dark-content',
};

export const darkTheme: Theme = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryDark: '#8B5CF6',
  
  secondary: '#F472B6',
  secondaryLight: '#F9A8D4',
  secondaryDark: '#EC4899',
  
  accent: '#22D3EE',
  
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  
  border: '#334155',
  borderLight: '#475569',
  divider: '#334155',
  
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  card: '#1E293B',
  cardBorder: '#334155',
  
  input: '#1E293B',
  inputBorder: '#475569',
  inputFocusBorder: '#A78BFA',
  inputPlaceholder: '#64748B',
  
  tabBar: '#0F172A',
  tabBarBorder: '#1E293B',
  tabBarActive: '#A78BFA',
  tabBarInactive: '#64748B',
  
  skeleton: '#334155',
  skeletonHighlight: '#475569',
  
  statusBar: 'light-content',
};

export const businessTheme: Theme = {
  ...darkTheme,
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  tabBarActive: '#3B82F6',
};
