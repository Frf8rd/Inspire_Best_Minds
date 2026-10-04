export const DAY_IN_MS = 864e5;

export const formatDate = (timestamp, locale = 'ro') => new Date(timestamp).toLocaleDateString(
  locale === 'ru' ? 'ru-RU' : 'ro-RO',
);
