import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { layout, spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';

import { AuthShowcase } from './AuthShowcase';

type Props = { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode };

/** Cadrul comun al tuturor ecranelor de autentificare: o coloană pe telefon, două coloane pe ecrane late. */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const { isExpanded } = useBreakpoint();

  return (
    <Screen style={styles.page}>
      {isExpanded ? <AuthShowcase /> : null}

      <View style={styles.main}>
        <Stack gap="lg" style={styles.column}>
          <Logo />
          <Stack gap="xs">
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
          </Stack>
          {children}
          {footer}
        </Stack>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flexDirection: 'row' },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  column: { width: '100%', maxWidth: layout.formMaxWidth },
});
