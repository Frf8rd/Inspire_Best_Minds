import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { Text } from './Text';

type Tone = 'accent' | 'success' | 'danger' | 'neutral';

const tones: Record<Tone, { fg: 'accent' | 'success' | 'danger' | 'muted'; bg: string }> = {
  accent: { fg: 'accent', bg: colors.accentSoft },
  success: { fg: 'success', bg: colors.successSoft },
  danger: { fg: 'danger', bg: colors.dangerSoft },
  neutral: { fg: 'muted', bg: colors.surface },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text variant="caption" tone={t.fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  text: { fontWeight: '600' },
});
