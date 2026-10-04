import { STATUSES } from '../data/categories.js';
import { statusLabel } from '../data/translations.js';

export default function StatusBadge({ status, locale = 'ro' }) {
  const [label, className] = STATUSES[status] || ['Status necunoscut', 'pending'];
  return <span className={`status-badge ${className}`}>{statusLabel(locale, status, label)}</span>;
}
