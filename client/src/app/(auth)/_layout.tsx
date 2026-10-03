import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

// Fără anchor, prima rută alfabetic (forgot-password) ar deveni ecranul inițial.
export const unstable_settings = { anchor: 'login' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
