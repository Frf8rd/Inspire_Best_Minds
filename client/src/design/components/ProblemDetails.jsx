import { CATEGORIES, STATUSES } from '../data/categories.js';
import { categoryLabel, serviceLabel, statusLabel } from '../data/translations.js';
import { formatDate } from '../utils/date.js';
import StatusBadge from './StatusBadge.jsx';

export default function ProblemDetails({ report, user, actions, onClose, onRequireAuth, t, locale, categories = CATEGORIES }) {
  const category = categories[report.cat] || CATEGORIES[report.cat] || ['', '', ''];
  const confirm = async () => {
    if (!user.id) {
      onRequireAuth?.();
      return;
    }
    try {
      await actions.confirm(report.id);
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  const setStatus = async (status) => {
    try {
      await actions.setStatus(report.id, status);
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div
      className="problem-details-overlay"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <section
        className="problem-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="problem-details-header">
          <div>
            <span className="problem-details-category">{categoryLabel(locale, report.cat, category[0])}</span>
            <h2 id="problem-details-title">{report.title}</h2>
          </div>
          <button className="problem-details-close" type="button" onClick={onClose} aria-label={t('close')}>
            ×
          </button>
        </header>

        {report.cameraPhoto && (
          <img className="problem-details-image" src={report.cameraPhoto} alt={report.title} />
        )}

        <div className="problem-details-summary">
          <StatusBadge status={report.st} locale={locale} />
          <span>#{report.code || report.id}</span>
          <span>{formatDate(report.date, locale)}</span>
        </div>

        <div className="problem-details-grid">
          <div className="problem-details-field">
            <span>{t('name')}</span>
            <strong>{report.by || t('citizen')}</strong>
          </div>
          <div className="problem-details-field">
            <span>{t('directedTo')}</span>
            <strong>{serviceLabel(locale, category[1], t)}</strong>
          </div>
          <div className="problem-details-field problem-details-field-wide">
            <span>{t('location')}</span>
            <strong>{report.address || t('location')}</strong>
          </div>
          {Number.isFinite(Number(report.lat)) && Number.isFinite(Number(report.lng)) && (
            <div className="problem-details-field problem-details-field-wide">
              <span>{t('coordinates')}</span>
              <strong>{Number(report.lat).toFixed(5)}, {Number(report.lng).toFixed(5)}</strong>
            </div>
          )}
          <div className="problem-details-field problem-details-field-wide">
            <span>{t('description')}</span>
            <p>{report.desc || report.title}</p>
          </div>
          {report.resolvedAt > 0 && (
            <div className="problem-details-field problem-details-field-wide">
              <span>{t('resolvedAt')}</span>
              <strong>{formatDate(report.resolvedAt, locale)}</strong>
            </div>
          )}
        </div>

        <footer className="problem-details-actions">
          <button
            className="btn btn-primary"
            onClick={user.id ? confirm : onRequireAuth}
          >
            {report.isSupported ? t('withdrawSupport') : t('confirmMeToo')} ({report.conf})
          </button>
          {user.role === 'emp' && (
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={report.st}
              onChange={(event) => setStatus(event.target.value)}
            >
              {Object.entries(STATUSES).map(([value, status]) => (
                <option key={value} value={value}>{statusLabel(locale, value, status[0])}</option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </footer>
      </section>
    </div>
  );
}
