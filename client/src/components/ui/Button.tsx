import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius, spacing } from '@/constants/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...rest }: Props) {
  const inactive = disabled || loading;
  const v = variants[variant];

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        v.container,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text variant="label" style={[styles.title, { color: v.textColor }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const variants = {
  primary: {
    container: { backgroundColor: colors.accent } as ViewStyle,
    textColor: colors.accentText,
    spinner: colors.accentText,
  },
  secondary: {
    container: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderStrong } as ViewStyle,
    textColor: colors.text,
    spinner: colors.text,
  },
  ghost: {
    container: { backgroundColor: 'transparent' } as ViewStyle,
    textColor: colors.textMuted,
    spinner: colors.textMuted,
  },
};

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouch,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700' },
  pressed: { transform: [{ scale: 0.99 }] },
  inactive: { opacity: 0.55 },
});
