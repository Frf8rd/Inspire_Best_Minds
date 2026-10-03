import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__about">
          <Link className="site-footer__brand" to="/" aria-label="Inspire Best Minds home">
            <span className="site-footer__mark">IB</span>
            <span>Inspire Best Minds</span>
          </Link>
          <p>Community-powered issue tracking for the city of Chișinău.</p>
          <span className="site-footer__location"><i /> Chișinău, Moldova</span>
        </div>

        <div className="site-footer__group">
          <h2>Explore</h2>
          <Link to="/map">Reported problems</Link>
          <Link to="/report">Report an issue</Link>
        </div>

        <div className="site-footer__group">
          <h2>Your account</h2>
          <Link to="/auth">Sign in or register</Link>
          <Link to="/profile">My profile</Link>
        </div>
      </div>

      <div className="site-footer__bottom">
        <small>© 2026 Inspire Best Minds</small>
        <small>Sample reports are simulated while the platform is in development.</small>
      </div>
    </footer>
  )
}