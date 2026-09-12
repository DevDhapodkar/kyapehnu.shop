/**
 * Kya Pehnu? — Luxury Atelier Theming Engine
 *
 * Implements Stitch.withgoogle Design Systems:
 * 1. "Ivory Studio Luxury" (Light Theme) — Stitch project 15360757500694020784
 * 2. "Royal Crimson & Gold Noir" (Dark Theme) — Stitch project 15360757500694020784
 */

export const lightTheme = {
  name: 'light',
  isDark: false,

  // Ground & Structural Foundations
  groundBase: '#FAF9F5',
  groundSubtle: '#F4F3EE',
  background: '#FAF9F5',
  surface: '#FAF9F5',
  surfaceDim: '#DBDAD6',
  surfaceBright: '#FAF9F5',
  surfacePorcelain: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceContainerLow: '#F4F4F0',
  surfaceContainer: '#EFEEEA',
  surfaceContainerHigh: '#E9E8E4',
  surfaceContainerHighest: '#E3E2DF',
  surfaceContainerLowest: '#FFFFFF',

  // Surfaces & Glassmorphism
  surfaceGlass: 'rgba(255, 255, 255, 0.75)',
  surfaceGlassCard: 'rgba(255, 255, 255, 0.88)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.95)',
  glassFill: 'rgba(255, 255, 255, 0.65)',
  glassFillStrong: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(18, 18, 20, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.90)',
  glassShadow: 'rgba(18, 18, 20, 0.06)',
  scrim: 'rgba(250, 249, 245, 0.60)',

  // Borders & Hairlines
  borderHairline: '#E5E3DC',
  borderHairlineAlpha: 'rgba(18, 18, 20, 0.08)',
  border: 'rgba(217, 119, 6, 0.15)',
  outline: '#8E6F6F',
  outlineVariant: '#E3BEBD',

  // Typography Tiers
  textObsidian: '#121215',
  textPrimary: '#121215',
  textSlate: '#4A4950',
  textSecondary: '#4A4950',
  textAsh: '#7E7C85',
  textMuted: '#7E7C85',
  onSurface: '#1B1C1A',
  onSurfaceVariant: '#5A4040',
  onBackground: '#1B1C1A',

  // Accents & Semantics
  accentCrimson: '#C4243A',
  accentCrimsonBright: '#C4243A',
  accentCrimsonHover: '#A81C30',
  accentCrimsonDeep: '#8E1B29',
  primary: '#A00025',
  primaryContainer: '#C4243A',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFDDDC',

  accentGold: '#B38A2B',
  accentGoldDeep: '#946C18',
  accentGoldLight: '#F7F2E7',
  secondary: '#795900',
  secondaryContainer: '#FECE68',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#765600',

  tertiary: '#95202D',
  tertiaryContainer: '#B63943',
  onTertiary: '#FFFFFF',

  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',

  // UI Components Spec
  headerBg: 'rgba(250, 249, 245, 0.88)',
  tabBarBg: 'rgba(255, 255, 255, 0.90)',
  tabBarBorder: 'rgba(18, 18, 20, 0.08)',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E3DC',
  inputBg: '#F4F3EE',
  inputBorder: '#E5E3DC',
  chipBg: '#F4F3EE',
  chipBorder: 'rgba(18, 18, 20, 0.08)',
  chipSelectedBg: '#121215',
  chipSelectedText: '#FFFFFF',

  // Legacy aliases
  obsidian: '#121215',
  obsidianDeep: '#0A0A0C',
  charcoal: '#131316',
  charcoalLight: '#1C1C21',
  graphite: '#2A2A31',
  ivory: '#FAF9F5',
  platinum: '#5C5A63',
  ash: '#7E7C85',
  slate: '#4A4950',
  crimson: '#8E1B29',
  gold: '#B38A2B',
  transparent: 'transparent',
};

export const darkTheme = {
  name: 'dark',
  isDark: true,

  // Void Canvas & Nocturnal Atelier Foundations
  groundBase: '#0E0E10',
  groundSubtle: '#161619',
  background: '#0E0E10',
  surface: '#131315',
  surfaceDim: '#0E0E10',
  surfaceBright: '#2A2A2E',
  surfacePorcelain: '#18181C',
  surfaceCard: '#161619',
  surfaceContainerLow: '#161619',
  surfaceContainer: '#1C1C20',
  surfaceContainerHigh: '#222226',
  surfaceContainerHighest: '#2B2B30',
  surfaceContainerLowest: '#0A0A0C',

  // Surfaces & Glassmorphism
  surfaceGlass: 'rgba(14, 14, 16, 0.82)',
  surfaceGlassCard: 'rgba(22, 22, 25, 0.88)',
  surfaceGlassStrong: 'rgba(26, 26, 30, 0.95)',
  glassFill: 'rgba(20, 20, 24, 0.72)',
  glassFillStrong: 'rgba(14, 14, 16, 0.90)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',
  glassShadow: 'rgba(0, 0, 0, 0.70)',
  scrim: 'rgba(5, 5, 6, 0.70)',

  // Hairline graphite delineations
  borderHairline: 'rgba(255, 255, 255, 0.08)',
  borderHairlineAlpha: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.10)',
  outline: '#AA8988',
  outlineVariant: 'rgba(255, 255, 255, 0.08)',

  // Typography Tiers
  textObsidian: '#F5F3EF',
  textPrimary: '#F5F3EF',
  textSlate: '#C9C7C2',
  textSecondary: '#A1A1AA',
  textAsh: '#76746E',
  textMuted: '#71717A',
  onSurface: '#F5F3EF',
  onSurfaceVariant: '#C9C7C2',
  onBackground: '#F5F3EF',

  // Accents & Semantics
  accentCrimson: '#C4243A',
  accentCrimsonBright: '#FF4D6D',
  accentCrimsonHover: '#D62842',
  accentCrimsonDeep: '#8E1B29',
  primary: '#FFB3B3',
  primaryContainer: '#C4243A',
  onPrimary: '#680015',
  onPrimaryContainer: '#FFDDDC',

  accentGold: '#C8A24A',
  accentGoldDeep: '#E6C875',
  accentGoldLight: 'rgba(200, 162, 74, 0.15)',
  secondary: '#EAC166',
  secondaryContainer: '#785A00',
  onSecondary: '#3F2E00',
  onSecondaryContainer: '#FDD376',

  tertiary: '#FFB3B3',
  tertiaryContainer: '#B63943',
  onTertiary: '#680015',

  error: '#FFB4AB',
  errorContainer: '#93000A',
  onError: '#690005',

  // UI Components Spec
  headerBg: 'rgba(14, 14, 16, 0.92)',
  tabBarBg: 'rgba(18, 18, 22, 0.92)',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  cardBg: '#161619',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  inputBg: '#1A1A1D',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  chipBg: '#201F21',
  chipBorder: 'rgba(255, 255, 255, 0.08)',
  chipSelectedBg: '#C4243A',
  chipSelectedText: '#FFFFFF',

  // Legacy aliases
  obsidian: '#050506',
  obsidianDeep: '#0A0A0C',
  charcoal: '#131316',
  charcoalLight: '#1C1C21',
  graphite: '#2A2A31',
  ivory: '#F5F3EF',
  platinum: '#C9C7C2',
  ash: '#76746E',
  slate: '#5C5A63',
  crimson: '#8E1B29',
  gold: '#C8A24A',
  transparent: 'transparent',
};

// Global reference for active theme proxy
if (typeof globalThis !== 'undefined' && !globalThis.__KYAPEHNU_ACTIVE_THEME__) {
  globalThis.__KYAPEHNU_ACTIVE_THEME__ = lightTheme;
}

/**
 * Proxy-based colors export:
 * Allows `colors.groundBase`, `colors.accentGold`, etc. to dynamically resolve
 * to the active theme at runtime without breaking existing imports.
 */
export const colors = new Proxy(lightTheme, {
  get(target, prop) {
    const active = globalThis.__KYAPEHNU_ACTIVE_THEME__ || target;
    if (prop in active) {
      return active[prop];
    }
    return target[prop];
  },
});

export const sceneColors = {
  get background() {
    return colors.groundBase;
  },
  get fog() {
    return colors.groundSubtle;
  },
  keyLight: '#FFFFFF',
  get rimLight() {
    return colors.accentCrimson;
  },
};

export const statusColors = {
  get PENDING() {
    return colors.accentGold;
  },
  get ACCEPTED() {
    return colors.accentGold;
  },
  get PACKED() {
    return colors.accentGold;
  },
  get READY_FOR_PICKUP() {
    return colors.accentCrimson;
  },
  get IN_TRANSIT() {
    return colors.accentCrimson;
  },
  get DELIVERED() {
    return colors.textSlate;
  },
  get CANCELLED() {
    return colors.accentCrimsonDeep;
  },
};

export const statusLabels = {
  PENDING: 'Placed',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready for Pickup',
  IN_TRANSIT: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export default colors;
