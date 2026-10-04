import { CATEGORIES } from '../data/categories.js';
import { categoryLabel, confirmationLabel } from '../data/translations.js';
import { formatDate } from '../utils/date.js';
import StatusBadge from './StatusBadge.jsx';

export default function ReportCard({ report, onOpen, selected = false, locale = 'ro', categories = CATEGORIES }) {
  const category = categories[report.cat] || CATEGORIES[report.cat] || ['', '', '●'];
  return (
    <div className={`item ${selected ? 'is-map-selected' : ''}`} onClick={() => onOpen(report.id)}>
      <div className="ico">{category[2]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{report.title}</b>
        <br />
        <small>
          {categoryLabel(locale, report.cat, category[0])} · {formatDate(report.date, locale)} · {report.conf} {confirmationLabel(locale, report.conf)}
        </small>
      </div>
      <StatusBadge status={report.st} locale={locale} />
    </div>
  );
}
