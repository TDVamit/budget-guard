export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  /** Text and icons sitting on an accent-filled background. */
  onAccent: string;
  positive: string;
  negative: string;
  warning: string;
  /** A track cut into a surface; must stay visible without colour. */
  track: string;
  glass: string;
  glassSolid: string;
  glassEdge: string;
  shadowDark: string;
  shadowLight: string;
  ambientA: string;
  ambientB: string;
  ambientC: string;
};

/**
 * Monochrome chrome, functional colour. Surfaces, text, buttons and borders are
 * black and white; hue is spent only where it carries meaning — spend status
 * and the direction of money. Colour is never the only signal: every status
 * also states its amount and a word.
 */
export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F4',
  border: 'rgba(0,0,0,0.12)',
  text: '#000000',
  textMuted: '#5E5E5E',
  accent: '#000000',
  onAccent: '#FFFFFF',
  positive: '#0A7D45',
  negative: '#C2321F',
  warning: '#8A6100',
  track: '#E4E4E4',
  glass: '#FFFFFF',
  glassSolid: '#FFFFFF',
  glassEdge: 'rgba(0,0,0,0.12)',
  shadowDark: 'rgba(0,0,0,0.10)',
  shadowLight: 'rgba(255,255,255,1)',
  ambientA: 'transparent',
  ambientB: 'transparent',
  ambientC: 'transparent',
};

/** True black, for OLED: the panel disappears and only the data is lit. */
export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#0E0E0E',
  surfaceAlt: '#171717',
  border: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textMuted: '#9E9E9E',
  accent: '#FFFFFF',
  onAccent: '#000000',
  positive: '#3DDC84',
  negative: '#FF6B63',
  warning: '#F5C24C',
  track: '#242424',
  glass: '#0E0E0E',
  glassSolid: '#0E0E0E',
  glassEdge: 'rgba(255,255,255,0.14)',
  shadowDark: 'rgba(0,0,0,0.6)',
  shadowLight: 'rgba(255,255,255,0.04)',
  ambientA: 'transparent',
  ambientB: 'transparent',
  ambientC: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/** The panel is moulded, not cut: curvature stays generous and consistent. */
export const radius = {
  pill: 999,
  control: 16,
  tile: 20,
  card: 26,
  sm: 12,
  md: 16,
  lg: 20,
};

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

/** Motion timings, from immediate feedback to the one authored entrance. */
export const motion = {
  feedback: 120,
  state: 240,
  layout: 420,
  focal: 700,
  stagger: 45,
};
