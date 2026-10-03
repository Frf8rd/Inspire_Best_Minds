import { Link, useNavigate } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import CasesMap from '../../components/CasesMap'
import CaseCard from '../../components/CaseCard'
import './HomePage.css'

export default function HomePage() {
  const { cases } = useCases()
  const navigate = useNavigate()
  const openCases = cases.filter((caseItem) => caseItem.status === 'new' || caseItem.status === 'in_progress').length
  const resolvedCases = cases.filter((caseItem) => caseItem.status === 'resolved').length
  const confirmations = cases.reduce((total, caseItem) => total + caseItem.votes.length, 0)
  const stats = [
    { label: 'Community reports', value: cases.length, detail: 'shared with the city' },
    { label: 'Being addressed', value: openCases, detail: 'awaiting a resolution' },
    { label: 'Resolved', value: resolvedCases, detail: 'closed by the community' },
    { label: 'Neighbor confirmations', value: confirmations, detail: 'voices behind these cases' },
  ]
  const latestCases = cases.slice(0, 4)
  const openMapCase = (id) => navigate(`/map?case=${encodeURIComponent(id)}`)

  return (
    <div className="page home-page">
      <header className="home-page__intro">
        <div className="home-page__intro-copy">
          <p className="home-page__eyebrow"><span /> Chișinău · Civic response</p>
          <h1>A clearer picture of our city.</h1>
          <p className="home-page__summary">
            Report a local problem, bring neighbors together, and follow its progress until it is resolved.
          </p>
          <div className="home-page__actions">
            <Link className="btn btn-primary" to="/report">Report a problem <span aria-hidden="true">↗</span></Link>
            <Link className="home-page__text-link" to="/map">Explore all cases <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="home-page__city-note">
          <span className="home-page__city-note-mark" aria-hidden="true">47°</span>
          <div>
            <strong>Local eyes. Shared progress.</strong>
            <p>Every report helps make the next decision clearer.</p>
          </div>
        </div>
      </header>

      <section aria-label="Community activity" className="home-page__stats">
        {stats.map((stat) => (
          <div className="home-page__stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.detail}</small>
          </div>
        ))}
      </section>

      <section className="home-page__map-section">
        <div className="home-page__section-heading">
          <div>
            <p className="home-page__eyebrow">Community map</p>
            <h2>Reports across Chișinău</h2>
          </div>
          <Link className="home-page__text-link" to="/map">Open full map <span aria-hidden="true">→</span></Link>
        </div>
        <div className="home-page__map-frame">
          <CasesMap cases={cases} onSelect={openMapCase} />
          <div className="home-page__map-caption">
            <span className="home-page__map-pulse" />
            <span>{cases.length} community reports</span>
            <span className="home-page__map-caption-divider" />
            <span>Chișinău, Moldova</span>
          </div>
          {!cases.length && (
            <div className="home-page__map-empty">
              <strong>The map is ready for its first report.</strong>
              <Link to="/report">Add a local issue <span aria-hidden="true">→</span></Link>
            </div>
          )}
        </div>
      </section>

      <section className="home-page__latest">
        <div className="home-page__section-heading">
          <div>
            <p className="home-page__eyebrow">From the neighborhood</p>
            <h2>Recent reports</h2>
          </div>
          <Link className="home-page__text-link" to="/map">View all <span aria-hidden="true">→</span></Link>
        </div>
        {latestCases.length ? (
          <div className="home-page__reports">
            {latestCases.map((caseItem) => (
              <CaseCard key={caseItem.id} c={caseItem} onClick={() => openMapCase(caseItem.id)} />
            ))}
          </div>
        ) : (
          <div className="home-page__empty-state">
            <p>No reports yet. Be the first to flag an issue in your neighborhood.</p>
            <Link className="home-page__text-link" to="/report">Create the first report <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </section>

      <p className="home-page__footnote">Sample reports are simulated while the platform is in development.</p>
    </div>
  )
}
