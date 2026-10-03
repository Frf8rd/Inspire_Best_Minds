import type { Href } from 'expo-router';

import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { TextLink } from '@/components/ui/TextLink';

/** Rândul de jos: „Nu ai cont? Creează cont" / „Ai deja cont? Intră". */
export function AuthSwitch({ prompt, action, href }: { prompt: string; action: string; href: Href }) {
  return (
    <Stack direction="row" gap="xs" justify="center" align="center">
      <Text variant="label" tone="muted">
        {prompt}
      </Text>
      <TextLink href={href}>{action}</TextLink>
    </Stack>
  );
}
