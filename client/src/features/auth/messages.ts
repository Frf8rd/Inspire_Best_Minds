/** Codurile `?error=` pe care backendul le trimite după Google OAuth. */
const oauthErrors: Record<string, string> = {
  google_auth_failed: 'Autentificarea cu Google a eșuat. Încearcă din nou.',
  google_not_configured: 'Autentificarea cu Google nu este disponibilă momentan.',
  account_disabled: 'Contul tău este dezactivat. Contactează un administrator.',
  server_error: 'A apărut o eroare pe server. Încearcă din nou în câteva minute.',
};

export function getOAuthErrorMessage(code?: string): string | undefined {
  return code ? (oauthErrors[code] ?? 'Autentificarea a eșuat. Încearcă din nou.') : undefined;
}
