import { Link, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { Text } from './Text';

export function TextLink({ href, children, muted = false }: { href: Href; children: string; muted?: boolean }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" hitSlop={8}>
        <Text variant="label" tone={muted ? 'muted' : 'accent'}>
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}
