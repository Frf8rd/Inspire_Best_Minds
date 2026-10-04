// Aceleași reguli ca în backend (auth.validator.js): minim 6 caractere și cel puțin o cifră.
export const PASSWORD_MIN_LENGTH = 6;

export function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Parola trebuie să aibă cel puțin ${PASSWORD_MIN_LENGTH} caractere.`;
  }
  if (!/\d/.test(password)) {
    return "Parola trebuie să conțină cel puțin o cifră.";
  }
  return null;
}
