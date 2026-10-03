import { Link, useNavigate } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import CaseCard from '../../components/CaseCard'
import { CATEGORIES } from '../../utils/constants'
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
  const categoryDetails = {
    pothole: 'Road damage and hazards',
    lighting: 'Street lights and visibility',
    parking: 'Blocked sidewalks and crossings',
    trash: 'Dumping and overflowing bins',
    sidewalk: 'Walking routes and surfaces',
    other: 'Other neighborhood concerns',
  }
  const categoryCounts = Object.entries(CATEGORIES).map(([key, label]) => ({
    key,
    label,
    detail: categoryDetails[key],
    count: cases.filter((caseItem) => caseItem.category === key).length,
  }))

  return (
    <div className="page home-page">
      <section aria-labelledby="home-hero-title" className="home-page__hero">
        <img
          alt="City street lined with buildings and trees"
          className="home-page__hero-image"
          src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=2200&q=85"
        />
        <div className="home-page__hero-shade" />
        <div className="home-page__hero-content">
          <p className="home-page__eyebrow"><span /> Chișinău · Civic response</p>
          <h1 id="home-hero-title">A clearer picture of our city.</h1>
          <p className="home-page__summary">
            Report local problems, bring neighbors together, and follow every case through to a resolution.
          </p>
          <div className="home-page__actions">
            <Link className="btn btn-primary" to="/report">Report a problem <span aria-hidden="true">↗</span></Link>
            <Link className="home-page__secondary-action" to="/map">See reported problems <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="home-page__hero-location"><span /> Chișinău, Moldova</div>
      </section>

      <section aria-label="Community activity" className="home-page__stats">
        {stats.map((stat) => (
          <div className="home-page__stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.detail}</small>
          </div>
        ))}
      </section>

      <section className="home-page__workflow">
        <div className="home-page__section-heading">
          <div>
            <p className="home-page__eyebrow">A simple local process</p>
            <h2>From what you notice to visible progress</h2>
          </div>
          <Link className="home-page__text-link" to="/report">Start a report <span aria-hidden="true">→</span></Link>
        </div>
        <ol className="home-page__workflow-list">
          <li className="home-page__workflow-step">
            <span className="home-page__step-number">01</span>
            <div>
              <h3>Show the issue</h3>
              <p>Add a short description, choose a category, and mark the location.</p>
            </div>
          </li>
          <li className="home-page__workflow-step">
            <span className="home-page__step-number">02</span>
            <div>
              <h3>Build the shared picture</h3>
              <p>Neighbors can confirm a case that affects their area too.</p>
            </div>
          </li>
          <li className="home-page__workflow-step">
            <span className="home-page__step-number">03</span>
            <div>
              <h3>Follow its status</h3>
              <p>Check whether a case is new, in progress, or resolved.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="home-page__categories">
        <div className="home-page__section-heading">
          <div>
            <p className="home-page__eyebrow">Everyday city issues</p>
            <h2>What needs attention near you?</h2>
          </div>
          <Link className="home-page__text-link" to="/map">Browse cases <span aria-hidden="true">→</span></Link>
        </div>
        <div className="home-page__category-list">
          {categoryCounts.map((category) => (
            <Link className="home-page__category" key={category.key} to="/map">
              <span className="home-page__category-copy">
                <strong>{category.label}</strong>
                <small>{category.detail}</small>
              </span>
              <span className="home-page__category-count">{category.count}</span>
              <span aria-hidden="true" className="home-page__category-arrow">↗</span>
            </Link>
          ))}
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
