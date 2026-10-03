import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { Text } from './Text';

/** Marca: un plus rotunjit (sesizare + răspuns), construit din View-uri — fără asset-uri. */
export function Logo({ showName = true }: { showName?: boolean }) {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="UrbanPulse">
      <View style={styles.mark}>
        <View style={[styles.bar, styles.horizontal]} />
        <View style={[styles.bar, styles.vertical]} />
      </View>
      {showName ? <Text variant="heading">UrbanPulse</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  mark: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', backgroundColor: colors.accent, borderRadius: radius.sm / 2 },
  horizontal: { width: 28, height: 10 },
  vertical: { width: 10, height: 28 },
});
