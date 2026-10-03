import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthSwitch } from '@/features/auth/components/AuthSwitch';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordScreen() {
  return (
    <AuthLayout
      title="Resetează parola"
      subtitle="Îți trimitem pe email un link valabil 10 minute."
      footer={<AuthSwitch prompt="Ți-ai amintit parola?" action="Intră în cont" href="/login" />}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
