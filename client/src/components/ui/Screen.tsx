import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type Props = { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> };

/** Fundalul, safe area, tastatura și scroll-ul — o singură dată, pentru toate ecranele. */
export function Screen({ children, scroll = true, style }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.select({ ios: 'padding', android: 'height' })}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.grow, style]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.grow, style]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grow: { flexGrow: 1 },
});
