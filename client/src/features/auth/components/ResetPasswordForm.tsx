import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormTextField } from '@/components/form/FormTextField';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Stack } from '@/components/ui/Stack';

import { useSubmit } from '../hooks/use-submit';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { useAuth } from '../session';

/** `token` vine din link-ul din email (?token=...). Dacă lipsește (ex. pe telefon), îl introduce utilizatorul. */
export function ResetPasswordForm({ token }: { token?: string }) {
  const { resetPassword } = useAuth();
  const { error, submit } = useSubmit();
  const { control, handleSubmit, formState } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(({ token: t, password }) => submit(() => resetPassword({ token: t, password })));

  return (
    <Stack gap="md">
      {error ? <Banner tone="error">{error}</Banner> : null}

      {token ? null : (
        <FormTextField
          control={control}
          name="token"
          label="Cod de resetare"
          hint="Îl găsești în linkul din email, după „token=”."
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
      )}
      <FormTextField
        control={control}
        name="password"
        label="Parolă nouă"
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
        label="Confirmă parola nouă"
        secureToggle
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button title="Salvează parola nouă" loading={formState.isSubmitting} onPress={onSubmit} />
    </Stack>
  );
}
