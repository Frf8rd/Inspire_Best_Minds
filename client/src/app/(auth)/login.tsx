import { useLocalSearchParams } from 'expo-router';

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthSwitch } from '@/features/auth/components/AuthSwitch';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { getOAuthErrorMessage } from '@/features/auth/messages';

export default function LoginScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();

  return (
    <AuthLayout
      title="Intră în cont"
      subtitle="Urmărește sesizările tale și raportează probleme din oraș."
      footer={<AuthSwitch prompt="Nu ai cont încă?" action="Creează cont" href="/register" />}>
      <LoginForm initialError={getOAuthErrorMessage(error)} />
    </AuthLayout>
  );
}
