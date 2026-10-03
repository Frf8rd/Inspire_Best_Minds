import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthSwitch } from '@/features/auth/components/AuthSwitch';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterScreen() {
  return (
    <AuthLayout
      title="Creează cont"
      subtitle="Durează un minut. Poți raporta prima problemă imediat după."
      footer={<AuthSwitch prompt="Ai deja cont?" action="Intră în cont" href="/login" />}>
      <RegisterForm />
    </AuthLayout>
  );
}
