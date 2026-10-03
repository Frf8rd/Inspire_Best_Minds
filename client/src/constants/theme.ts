/** Design tokens — singura sursă pentru culori, spații, rotunjiri și tipografie. */
export const colors = {
  bg: '#101010',
  surface: '#191919',
  surfaceRaised: '#222222',
  border: '#2C2C2C',
  borderStrong: '#3C3C3C',
  text: '#F3F3F2',
  textMuted: '#8D8D8A',
  accent: '#F5A83B',
  accentText: '#1A1204',
  accentSoft: 'rgba(245,168,59,0.14)',
  success: '#7DDB4F',
  successSoft: 'rgba(125,219,79,0.12)',
  danger: '#F0625A',
  dangerSoft: 'rgba(240,98,90,0.12)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const breakpoints = { medium: 600, expanded: 1024 } as const;
export const layout = { formMaxWidth: 420, minTouch: 48 } as const;

export type SpacingKey = keyof typeof spacing;
