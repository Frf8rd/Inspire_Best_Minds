import { useLocalSearchParams } from 'expo-router';

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthSwitch } from '@/features/auth/components/AuthSwitch';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  return (
    <AuthLayout
      title="Alege o parolă nouă"
      subtitle="Actualizezi parola, apoi ești autentificat automat."
      footer={<AuthSwitch prompt="Linkul a expirat?" action="Cere altul" href="/forgot-password" />}>
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}
