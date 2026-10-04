import NavIcon from './NavIcon.jsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ROUTES = {
  home: '/',
  map: '/map',
  report: '/problems/create',
  'my-problems': '/my-problems',
  notifications: '/notifications',
  profile: '/profile',
  staff: '/staff',
  admin: '/admin',
};

export default function DashboardLayout({ activePage, user, onLogout, isGuest = false, unreadCount = 0, children, t }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const accountRoleLabel = () => {
    if (user.serverRole === 'ADMIN') return t('administrator');
    if (user.serverRole !== 'STAFF') return t('citizen');
    const membershipRoles = [...new Set((user.memberships || []).map((membership) => membership.role))];
    const labels = membershipRoles.map((role) =>
      role === 'MANAGER' ? t('staffManager') : t('staffOperator')
    );
    return labels.join(' · ') || t('staff');
  };
  const navigation = [
    'home',
    'map',
    'report',
    ...(!isGuest ? ['my-problems', 'notifications'] : []),
    ...(!isGuest ? ['profile'] : []),
    ...(!isGuest && user.serverRole === 'STAFF' ? ['staff'] : []),
    ...(!isGuest && user.serverRole === 'ADMIN' ? ['staff', 'admin'] : []),
  ];
  const mobileNavigation = ['home', 'map', 'report', ...(!isGuest ? ['profile'] : [])];
  const labels = {
    'my-problems': 'Sesizările mele',
    notifications: 'Notificări',
    staff: 'Panou personal',
    admin: 'Administrare',
  };
  return (
    <>
      <div className="background" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className={`dashboard ${activePage === 'home' ? 'dashboard-home' : ''} ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
        <aside
          className={`sidebar ${sidebarExpanded ? 'is-expanded' : ''}`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          onFocusCapture={() => setSidebarExpanded(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setSidebarExpanded(false);
          }}
          onClickCapture={(event) => {
            if (event.target instanceof Element && event.target.closest('a, button')) {
              setSidebarExpanded(false);
            }
          }}
        >
          <div className="sidebar-header">
            <div className="logo">UP</div>
            <span className="logo-text">UrbanPulse</span>
          </div>
          <ul className="nav-menu">
            <li className="nav-section">
              <span className="nav-section-title">{t('menu')}</span>
              <ul>
                {navigation.map((page) => (
                  <li key={page} className="nav-item">
                    <Link
                      className={`nav-link ${page === activePage ? 'active' : ''}`}
                      to={ROUTES[page]}
                      aria-label={labels[page] || t(page)}
                      title={labels[page] || t(page)}
                    >
                      <NavIcon name={page} />
                      <span className="nav-label">
                        {labels[page] || t(page)}
                        {page === 'notifications' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
          <div className="sidebar-footer">
            {isGuest ? (
              <Link className="user-profile sidebar-profile" to="/login" aria-label="Conectare" title="Conectare">
                <div className="user-avatar">↗</div>
                <div className="user-info">
                  <div className="user-name">Conectare</div>
                  <div className="user-role">Intră în cont</div>
                </div>
              </Link>
            ) : (
              <Link
                className={`user-profile sidebar-profile ${activePage === 'profile' ? 'active' : ''}`}
                to={ROUTES.profile}
                aria-label={t('profile')}
                title={t('profile')}
              >
              <div className="user-avatar">{user.name[0]}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{accountRoleLabel()}</div>
              </div>
              </Link>
            )}
            {!isGuest && (
              <button
                className="btn btn-secondary sidebar-logout"
                style={{ width: '100%' }}
                onClick={onLogout}
                aria-label={t('logout')}
              >
                <NavIcon name="logout" />
                <span className="nav-label">{t('logout')}</span>
              </button>
            )}
          </div>
        </aside>
        <main className="main-content">
          {children}
          <div className="site-footer-spacer" aria-hidden="true" />
          <footer className="site-footer">
            <div className="site-footer-main">
              <section className="site-footer-about">
                <strong className="site-footer-brand">UrbanPulse</strong>
                <p>{t('footerTagline')}</p>
                <span>{t('footerAboutText')}</span>
              </section>
              <nav className="site-footer-links" aria-label={t('footerNavigation')}>
                <strong>{t('footerQuickLinks')}</strong>
                <Link to="/">{t('home')}</Link>
                <Link to="/map">{t('map')}</Link>
                <Link to="/problems/create">{t('report')}</Link>
                {!isGuest && <Link to="/profile">{t('profile')}</Link>}
              </nav>
              <section className="site-footer-community">
                <strong>{t('footerCommunityHeading')}</strong>
                <p>{t('footerCommunityText')}</p>
              </section>
            </div>
            <div className="site-footer-bottom">
              <small className="site-footer-copyright">{t('footerCopyright')}</small>
              <small>UrbanPulse · Chișinău</small>
            </div>
          </footer>
        </main>
      </div>
      <nav className="bottom">
        {mobileNavigation.map((page) => (
          <Link
            key={page}
            className={page === activePage ? 'active' : ''}
            to={ROUTES[page]}
          >
            <NavIcon name={page} />
            {labels[page] || t(page)}
          </Link>
        ))}
      </nav>
    </>
  );
}
