import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/session';

/** Backendul a setat deja cookie-urile; confirmăm sesiunea cu /auth/me (nu ne bazăm pe `?user=`). */
export default function GoogleSuccessScreen() {
  const { refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    refresh().then((ok) => {
      if (active) router.replace(ok ? '/' : '/login?error=google_auth_failed');
    });
    return () => {
      active = false;
    };
  }, [refresh, router]);

  return (
    <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Stack gap="md" align="center">
        <ActivityIndicator color={colors.accent} />
        <Text tone="muted">Te autentificăm…</Text>
      </Stack>
    </Screen>
  );
}
