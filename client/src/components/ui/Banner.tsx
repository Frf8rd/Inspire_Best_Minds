import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { Text } from './Text';

type Tone = 'error' | 'success' | 'info';

const tones = {
  error: { bg: colors.dangerSoft, border: colors.danger, text: 'danger' },
  success: { bg: colors.successSoft, border: colors.success, text: 'success' },
  info: { bg: colors.accentSoft, border: colors.accent, text: 'accent' },
} as const;

export function Banner({ tone = 'info', children }: { tone?: Tone; children: string }) {
  const t = tones[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text variant="label" tone={t.text} style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  text: { fontWeight: '500', lineHeight: 20 },
});
