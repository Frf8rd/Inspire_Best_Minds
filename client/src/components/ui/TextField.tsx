import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, layout, radius, spacing } from '@/constants/theme';

import { Text } from './Text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  /** Pentru parole: ascunde textul și afișează butonul Arată/Ascunde. */
  secureToggle?: boolean;
};

export function TextField({ label, error, hint, secureToggle = false, onFocus, onBlur, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="muted">
        {label}
      </Text>

      <View style={[styles.box, focused && styles.boxFocused, !!error && styles.boxError]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureToggle && !revealed}
          selectionColor={colors.accent}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ascunde parola' : 'Arată parola'}
            hitSlop={8}
            onPress={() => setRevealed((r) => !r)}>
            <Text variant="label" tone="accent">
              {revealed ? 'Ascunde' : 'Arată'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  box: {
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.accent },
  boxError: { borderColor: colors.danger },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: spacing.sm, outlineWidth: 0 },
});
