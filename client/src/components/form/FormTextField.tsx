import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { TextField, type TextFieldProps } from '@/components/ui/TextField';

type Props<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T>;
  name: Path<T>;
};

/** TextField legat la react-hook-form: valoare, onBlur și mesajul de eroare vin automat. */
export function FormTextField<T extends FieldValues>({ control, name, onBlur, ...rest }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={(e) => {
            field.onBlur();
            onBlur?.(e);
          }}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
