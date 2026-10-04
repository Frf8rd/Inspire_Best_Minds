import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { Logo } from '@/components/ui/Logo';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/session';

const roleLabel = { CITIZEN: 'Cetățean', STAFF: 'Personal instituție', ADMIN: 'Administrator' } as const;

/** Ecran temporar, vizibil doar după autentificare. Aici vor veni harta și lista de sesizări. */
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);

  if (!user) return null;

  return (
    <Screen style={styles.page}>
      <View style={styles.column}>
        <Stack gap="md">
          <Card style={styles.hero}>
            <Stack gap="md">
              <Stack direction="row" justify="space-between" align="center">
                <Logo />
                <Badge label={roleLabel[user.role]} tone="accent" />
              </Stack>
              <Stack gap="xs">
                <Text variant="title">Salut, {user.name}</Text>
                <Text tone="muted">Bine ai revenit. Iată starea contului tău UrbanPulse.</Text>
              </Stack>
              <Stack gap="sm">
                <ProgressBar value={0.66} />
                <Text variant="caption" tone="muted">
                  Profil activ și pregătit pentru sesizări noi
                </Text>
              </Stack>
            </Stack>
          </Card>

          <Card>
            <Stack gap="sm">
              <Text variant="heading">Date cont</Text>
              <Divider />
              <Stack gap="xs">
                <Text variant="caption" tone="muted">
                  Email
                </Text>
                <Text>{user.email}</Text>
              </Stack>
              {user.memberships?.map((m) => (
                <Stack key={m.id} gap="xs">
                  <Text variant="caption" tone="muted">
                    Instituție
                  </Text>
                  <Text>
                    {m.institution.name}
                    {m.department ? ` · ${m.department.name}` : ''}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Stack direction="row" gap="sm">
            <Card style={styles.quickCard}>
              <Stack gap="xs">
                <Text variant="caption" tone="muted">
                  Timp mediu răspuns
                </Text>
                <Text variant="heading">48h</Text>
              </Stack>
            </Card>
            <Card style={styles.quickCard}>
              <Stack gap="xs">
                <Text variant="caption" tone="muted">
                  Sesizări active
                </Text>
                <Text variant="heading">3</Text>
              </Stack>
            </Card>
          </Stack>

          <Stack gap="sm">
            <Button variant="secondary" title="Vezi sesizările mele" />
            <Button variant="secondary" title="Raportează o problemă" />
            <Button
              variant="ghost"
              title="Ieși din cont"
              loading={leaving}
              onPress={async () => {
                setLeaving(true);
                await logout();
              }}
            />
          </Stack>
        </Stack>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', padding: spacing.lg },
  column: { width: '100%', maxWidth: 560 },
  hero: { borderColor: colors.borderStrong },
  quickCard: { flex: 1, borderRadius: radius.md },
});
