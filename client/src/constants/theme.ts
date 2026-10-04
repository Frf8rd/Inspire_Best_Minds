/** Design tokens — singura sursă pentru culori, spații, rotunjiri și tipografie. */
export const colors = {
  bg: '#090B10',
  surface: '#131823',
  surfaceRaised: '#1B2230',
  surfaceMuted: '#212B3D',
  border: '#2B354A',
  borderStrong: '#3B4C6A',
  text: '#EEF3FF',
  textMuted: '#9CAACC',
  accent: '#5FA5FF',
  accentText: '#08172D',
  accentSoft: 'rgba(95,165,255,0.2)',
  success: '#59D6A9',
  successSoft: 'rgba(89,214,169,0.18)',
  danger: '#FF7D8E',
  dangerSoft: 'rgba(255,125,142,0.18)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const breakpoints = { medium: 600, expanded: 1024 } as const;
export const layout = { formMaxWidth: 420, minTouch: 48 } as const;

export type SpacingKey = keyof typeof spacing;
