import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormTextField } from '@/components/form/FormTextField';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Stack } from '@/components/ui/Stack';
import { TextLink } from '@/components/ui/TextLink';

import { useSubmit } from '../hooks/use-submit';
import { loginSchema, type LoginValues } from '../schemas';
import { useAuth } from '../session';
import { GoogleAuthSection } from './GoogleAuthSection';

export function LoginForm({ initialError }: { initialError?: string }) {
  const { login } = useAuth();
  const { error, submit } = useSubmit();
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => submit(() => login(values)));
  const message = error ?? initialError;

  return (
    <Stack gap="md">
      {message ? <Banner tone="error">{message}</Banner> : null}

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
        name="password"
        label="Parolă"
        secureToggle
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Stack direction="row" justify="flex-end">
        <TextLink href="/forgot-password">Ai uitat parola?</TextLink>
      </Stack>

      <Button title="Intră în cont" loading={formState.isSubmitting} onPress={onSubmit} />
      <GoogleAuthSection />
    </Stack>
  );
}
