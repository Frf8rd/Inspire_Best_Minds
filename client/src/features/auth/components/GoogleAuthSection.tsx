import { Platform } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Stack } from '@/components/ui/Stack';

import { authApi } from '../api';

/**
 * Doar pe web: backendul redirecționează după Google către un singur CLIENT_URL.
 * Pe Expo Go aplicația nu poate primi acel redirect, deci secțiunea nu se afișează.
 */
export function GoogleAuthSection() {
  if (Platform.OS !== 'web') return null;

  return (
    <Stack gap="md">
      <Divider label="sau" />
      <Button variant="secondary" title="Continuă cu Google" onPress={() => window.location.assign(authApi.googleUrl)} />
    </Stack>
  );
}
