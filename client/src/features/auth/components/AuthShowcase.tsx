import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/constants/theme';

/** Panoul din stânga pe ecrane late: o sesizare-exemplu, în stilul cardului din dashboard. */
export function AuthShowcase() {
  return (
    <View style={styles.panel}>
      <Stack gap="xl" style={styles.content}>
        <Stack gap="sm">
          <Badge label="UrbanPulse" tone="accent" />
          <Text variant="display">Transformă sesizările în soluții reale.</Text>
          <Text tone="muted">
            Raportezi rapid, urmărești progresul în timp real și primești răspuns direct de la instituția responsabilă.
          </Text>
        </Stack>

        <Card style={styles.sample}>
          <Stack gap="md">
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="heading">#UP-0012</Text>
              <Badge label="În lucru" tone="success" />
            </Stack>
            <Text>Groapă mare pe stradă, str. Exemplu 10</Text>

            <Stack gap="sm">
              <ProgressBar value={0.66} />
              <Stack direction="row" justify="space-between">
                <Text variant="caption" tone="muted">
                  Raportată
                </Text>
                <Text variant="caption" tone="muted">
                  Pasul 4 din 6
                </Text>
                <Text variant="caption" tone="muted">
                  Rezolvată
                </Text>
              </Stack>
            </Stack>

            <Stack direction="row" gap="sm">
              <Stack gap="xs" style={styles.tile}>
                <Text variant="caption" tone="muted">
                  Departament
                </Text>
                <Text variant="label">Infrastructură</Text>
              </Stack>
              <Stack gap="xs" style={styles.tile}>
                <Text variant="caption" tone="muted">
                  Prioritate
                </Text>
                <Text variant="label">Medie</Text>
              </Stack>
            </Stack>
          </Stack>
        </Card>
        <Stack direction="row" gap="sm">
          <Stack gap="xs" style={styles.metric}>
            <Text variant="heading">2m</Text>
            <Text variant="caption" tone="muted">
              până la trimitere
            </Text>
          </Stack>
          <Stack gap="xs" style={styles.metric}>
            <Text variant="heading">24/7</Text>
            <Text variant="caption" tone="muted">
              status actualizat
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    margin: spacing.md,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  content: { maxWidth: 520 },
  sample: { backgroundColor: colors.bg },
  tile: { flex: 1, padding: spacing.md - 4, borderRadius: radius.md, backgroundColor: colors.surface },
  metric: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
});
