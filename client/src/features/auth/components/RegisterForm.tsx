import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormTextField } from '@/components/form/FormTextField';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Stack } from '@/components/ui/Stack';

import { useSubmit } from '../hooks/use-submit';
import { registerSchema, type RegisterValues } from '../schemas';
import { useAuth } from '../session';
import { GoogleAuthSection } from './GoogleAuthSection';

export function RegisterForm() {
  const { register } = useAuth();
  const { error, submit } = useSubmit();
  const { control, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(({ name, email, phone, password }) =>
    submit(() => register({ name, email, password, phone: phone || undefined })),
  );

  return (
    <Stack gap="md">
      {error ? <Banner tone="error">{error}</Banner> : null}

      <FormTextField control={control} name="name" label="Nume complet" autoComplete="name" textContentType="name" returnKeyType="next" />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="nume@exemplu.md"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="phone"
        label="Telefon (opțional)"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="password"
        label="Parolă"
        hint="Minim 6 caractere, cu cel puțin o cifră."
        secureToggle
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirmă parola"
        secureToggle
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button title="Creează cont" loading={formState.isSubmitting} onPress={onSubmit} />
      <GoogleAuthSection />
    </Stack>
  );
}
