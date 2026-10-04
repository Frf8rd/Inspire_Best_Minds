export default function PageHeader({ title, subtitle }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
    </div>
  );
}
