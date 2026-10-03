import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormTextField } from '@/components/form/FormTextField';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Stack } from '@/components/ui/Stack';
import { TextLink } from '@/components/ui/TextLink';

import { authApi } from '../api';
import { useSubmit } from '../hooks/use-submit';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';

export function ForgotPasswordForm() {
  const { error, submit } = useSubmit();
  const [sent, setSent] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(({ email }) =>
    submit(async () => {
      const { message } = await authApi.forgotPassword(email);
      setSent(message);
    }),
  );

  return (
    <Stack gap="md">
      {error ? <Banner tone="error">{error}</Banner> : null}
      {sent ? <Banner tone="success">{sent}</Banner> : null}

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
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button title="Trimite link de resetare" loading={formState.isSubmitting} onPress={onSubmit} />

      {sent ? (
        <Stack direction="row" justify="center">
          <TextLink href="/reset-password">Am primit un cod</TextLink>
        </Stack>
      ) : null}
    </Stack>
  );
}
