import { Link } from 'react-router-dom';

export default function PreferenceControls({ locale, onLocaleChange, theme, onThemeToggle, t }) {
  return (
    <div className="preference-controls">
      <Link className="mobile-brand" to="/" aria-label={t('dashboardTitle')} title={t('dashboardTitle')}>
        <img src="/logo.png" alt="" />
      </Link>
      <label className="language-control">
        <span className="sr-only">{t('language')}</span>
        <select
          value={locale}
          onChange={(event) => onLocaleChange(event.target.value)}
          aria-label={t('language')}
        >
          <option value="ro">RO</option>
          <option value="ru">RU</option>
        </select>
      </label>
      <button
        className="theme-toggle"
        type="button"
        onClick={onThemeToggle}
        aria-label={`${t('theme')}: ${theme === 'dark' ? t('dark') : t('light')}`}
        title={`${t('theme')}: ${theme === 'dark' ? t('dark') : t('light')}`}
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.7 8.7 0 1 0 20.2 15.4Z" />
          </svg>
        )}
        <span>{theme === 'dark' ? t('dark') : t('light')}</span>
      </button>
    </div>
  );
}
