import { z } from 'zod';

// Regulile oglindesc validările backendului (name 2–50, parolă ≥ 6 cu o cifră).
const email = z.string().trim().min(1, 'Introdu adresa de email').email('Adresa de email nu este validă');
const newPassword = z
  .string()
  .min(6, 'Parola trebuie să aibă minim 6 caractere')
  .regex(/\d/, 'Parola trebuie să conțină cel puțin o cifră');

const passwordsMatch = {
  check: (v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword,
  error: { message: 'Parolele nu coincid', path: ['confirmPassword'] },
};

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Introdu parola'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Numele trebuie să aibă minim 2 caractere').max(50, 'Numele poate avea maxim 50 de caractere'),
    email,
    phone: z.string().trim().optional(),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.error);

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Introdu codul primit pe email'),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.error);

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
