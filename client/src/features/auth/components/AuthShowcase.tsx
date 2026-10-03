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
          <Text variant="display">Fiecare sesizare, urmărită până la rezolvare.</Text>
          <Text tone="muted">Raportezi o problemă din oraș, iar instituția responsabilă o preia și îți răspunde.</Text>
        </Stack>

        <Card style={styles.sample}>
          <Stack gap="md">
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="heading">#UP-0012</Text>
              <Badge label="Confirmată" tone="accent" />
            </Stack>
            <Text>Groapă mare pe stradă, str. Exemplu 10</Text>

            <Stack gap="sm">
              <ProgressBar value={0.5} />
              <Stack direction="row" justify="space-between">
                <Text variant="caption" tone="muted">
                  Raportată
                </Text>
                <Text variant="caption" tone="muted">
                  Pasul 3 din 6
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
        <Text variant="caption" tone="muted">
          Exemplu de sesizare
        </Text>
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
    borderColor: colors.border,
  },
  content: { maxWidth: 520 },
  sample: { backgroundColor: colors.bg },
  tile: { flex: 1, padding: spacing.md - 4, borderRadius: radius.md, backgroundColor: colors.surface },
});
