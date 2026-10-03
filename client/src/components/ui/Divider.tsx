import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

import { Text } from './Text';

export function Divider({ label }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
      {label ? <View style={styles.line} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
});
