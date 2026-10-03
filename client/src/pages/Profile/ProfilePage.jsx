import './ProfilePage.css'

const defaultProfileData = {
  role: 'user',
  name: '',
  roleLabel: '',
  roleTag: '',
  highlight: '',
  primaryAction: '',
  stats: [],
  panels: [{ title: 'Overview', items: [] }, { title: 'Recent activity', items: [] }],
}

const allowedRoles = ['user', 'admin', 'organization']

function ProfilePage({ profileData = defaultProfileData, currentUser = null }) {
  const user = currentUser || profileData || defaultProfileData
  const resolvedRole = allowedRoles.includes(user.role) ? user.role : 'user'

  const profile = {
    ...defaultProfileData,
    ...user,
    role: resolvedRole,
  }

  const safeStats = profile.stats?.length ? profile.stats : []
  const safePanels = profile.panels?.length ? profile.panels : defaultProfileData.panels

  if (!profile.name && !profile.roleLabel && !profile.roleTag) {
    return (
      <main className="profile-shell empty-profile-shell">
        <div className="empty-profile">
          <p>No profile loaded for this user yet.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="profile-shell">
      <aside className="role-sidebar">
        <div className="brand-block">
          <span className="brand-mark">IB</span>
          <span>Inspire Best Minds</span>
        </div>

        <div className="mini-card">
          <span className="mini-label">Logged in as</span>
          <strong>{profile.roleLabel || profile.role}</strong>
        </div>
      </aside>

      <section className="profile-content">
        <header className="profile-header">
          <div className="avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}</div>

          <div>
            <p className="eyebrow">{profile.highlight || 'Profile'}</p>
            <h1>{profile.name || 'Loading profile...'}</h1>
            <span className="role-tag">{profile.roleTag || 'Profile access granted'}</span>
          </div>

          <button type="button" className="primary-btn" disabled={!profile.primaryAction}>
            {profile.primaryAction || 'View details'}
          </button>
        </header>

        {safeStats.length > 0 ? (
          <div className="stats-grid">
            {safeStats.map((item) => (
              <div className="stat-card" key={item.label || item.id || item.key}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No profile statistics available yet.</div>
        )}

        <div className="panel-grid">
          {safePanels.map((panel) => (
            <div className="panel" key={panel.title || 'panel'}>
              <h3>{panel.title}</h3>
              {panel.items?.length ? (
                <ul>
                  {panel.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="panel-empty">Waiting for data from the database.</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default ProfilePage
