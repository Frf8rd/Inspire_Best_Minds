import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/constants/theme';
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
        <Stack gap="lg">
          <Logo />
          <Stack gap="xs">
            <Text variant="title">Salut, {user.name}</Text>
            <Text tone="muted">{user.email}</Text>
          </Stack>

          <Card>
            <Stack gap="sm">
              <Badge label={roleLabel[user.role]} tone="accent" />
              {user.memberships?.map((m) => (
                <Text key={m.id} tone="muted">
                  {m.institution.name}
                  {m.department ? ` · ${m.department.name}` : ''}
                </Text>
              ))}
            </Stack>
          </Card>

          <Button
            variant="secondary"
            title="Ieși din cont"
            loading={leaving}
            onPress={async () => {
              setLeaving(true);
              await logout();
            }}
          />
        </Stack>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', padding: spacing.lg },
  column: { width: '100%', maxWidth: 560 },
});
