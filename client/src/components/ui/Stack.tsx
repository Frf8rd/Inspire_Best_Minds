import { View, type ViewProps, type ViewStyle } from 'react-native';

import { spacing, type SpacingKey } from '@/constants/theme';

type Props = ViewProps & {
  gap?: SpacingKey;
  direction?: 'column' | 'row';
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
};

/** Înlocuiește `View + flexDirection + gap` repetat în fiecare ecran. */
export function Stack({ gap = 'md', direction = 'column', align, justify, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[{ flexDirection: direction, gap: spacing[gap], alignItems: align, justifyContent: justify }, style]}
    />
  );
}
