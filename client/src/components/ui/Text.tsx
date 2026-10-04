import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors } from '@/constants/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'accent' | 'danger' | 'success';

export type TextProps = RNTextProps & { variant?: Variant; tone?: Tone };

const toneColor: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  accent: colors.accent,
  danger: colors.danger,
  success: colors.success,
};

export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  return <RNText {...rest} style={[styles[variant], { color: toneColor[tone] }, style]} />;
}

const styles = StyleSheet.create({
  display: { fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -0.8 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
});
