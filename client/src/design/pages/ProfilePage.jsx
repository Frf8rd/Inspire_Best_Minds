import { useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ReportCard from '../components/ReportCard.jsx';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ProfilePage({ reports, myReports: userReports, categories, openReport, user, locale, t, onUpdateProfile }) {
  const { addToast } = useToast();
  const photoInput = useRef(null);
  const avatarStorageKey = `up_avatar_${encodeURIComponent(user.phone || user.name)}`;
  const [avatar, setAvatar] = useState(() => {
    try {
      return localStorage.getItem(avatarStorageKey) || '';
    } catch (error) {
      console.error('Unable to load profile photo', error);
      return '';
    }
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone || '',
    bio: user.bio || '',
  });
  const serverAvatar = user.avatarPath ? assetUrl(user.avatarPath) : '';
  const myReports = (userReports || reports.filter((report) => report.by === user.name))
    .sort((first, second) => new Date(second.date) - new Date(first.date));
  const resolvedReports = myReports.filter((report) => report.st === 'done').length;
  const inProgressReports = myReports.filter((report) => report.st === 'progress').length;
  const confirmations = myReports.reduce((total, report) => total + report.conf, 0);
  const resolutionRate = myReports.length
    ? Math.round((resolvedReports / myReports.length) * 100)
    : 0;
  const accountRoleLabel = user.serverRole === 'ADMIN'
    ? t('administrator')
    : user.serverRole === 'STAFF'
      ? [...new Set((user.memberships || []).map((membership) => membership.role))]
        .map((role) => role === 'MANAGER' ? t('staffManager') : t('staffOperator'))
        .join(' · ') || t('staff')
      : t('citizen');
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const updatePhoto = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert(t('profilePhotoInvalid'));
      input.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      window.alert(t('profilePhotoTooLarge'));
      input.value = '';
      return;
    }

    try {
      const image = await createImageBitmap(file);
      const cropSize = Math.min(image.width, image.height);
      if (!cropSize) {
        image.close();
        throw new Error(t('profilePhotoInvalid'));
      }

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) {
        image.close();
        throw new Error(t('profilePhotoSaveError'));
      }

      context.drawImage(
        image,
        (image.width - cropSize) / 2,
        (image.height - cropSize) / 2,
        cropSize,
        cropSize,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      image.close();

      const photo = canvas.toDataURL('image/jpeg', 0.82);
      try {
        localStorage.setItem(avatarStorageKey, photo);
      } catch (error) {
        throw new Error(t('profilePhotoSaveError'), { cause: error });
      }
      setAvatar(photo);
    } catch (error) {
      console.error('Unable to update profile photo', error);
      window.alert(error.message === t('profilePhotoInvalid')
        ? error.message
        : t('profilePhotoSaveError'));
    } finally {
      input.value = '';
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile(profile);
      setEditing(false);
      addToast(t('profileSaved'), 'success');
    } catch (error) {
      console.error('Unable to update profile', error);
      addToast(error.message || t('profileSaveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-heading">
        <PageHeader title={t('profileTitle')} subtitle={t('profileDescription')} />
      </div>

      <div className="profile-dashboard-grid">
        <section className="glass-card profile-hero" aria-label={t('profileTitle')}>
          <div className="profile-cover">
            <span className="profile-cover-orb profile-cover-orb-one" />
            <span className="profile-cover-orb profile-cover-orb-two" />
            <span className="profile-cover-label">{t('profileEyebrow')}</span>
          </div>
          <div className="profile-identity">
            <div className="profile-avatar-large">
              {avatar || serverAvatar ? (
                <img className="profile-avatar-photo" src={avatar || serverAvatar} alt="" />
              ) : initials}
              <button
                className="profile-avatar-edit"
                type="button"
                aria-label={t('profileChangePhoto')}
                title={t('profileChangePhoto')}
                onClick={() => photoInput.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4v-10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </button>
              <input
                ref={photoInput}
                className="profile-avatar-input"
                type="file"
                accept="image/*"
                aria-label={t('profileChangePhoto')}
                onChange={updatePhoto}
              />
            </div>
            <div className="profile-identity-copy">
              <span className="profile-member-label">
                <span className="profile-member-dot" />
                {t('profileMember')}
              </span>
              <h2>{user.name}</h2>
              <p>{accountRoleLabel}</p>
            </div>
            <Link className="profile-identity-link" to="/problems/create">
              {t('profileContribute')}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="profile-contact">
            <span className="profile-contact-icon" aria-hidden="true">☎</span>
            <span>{user.phone || t('profileNoPhone')}</span>
          </div>
        </section>

        <section className="glass-card pad profile-account-card">
          <div className="profile-section-heading">
            <div>
              <span className="profile-section-kicker">{t('profileAccountEyebrow')}</span>
              <h2>{t('profileAccountTitle')}</h2>
            </div>
            {!editing && (
              <button className="btn btn-secondary" type="button" onClick={() => setEditing(true)}>
                {t('profileEdit')}
              </button>
            )}
          </div>
          {editing ? (
            <form onSubmit={saveProfile}>
              <label className="form-group">
                <span className="form-label">{t('name')}</span>
                <input
                  className="form-input"
                  value={profile.name}
                  minLength={2}
                  maxLength={50}
                  required
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                />
              </label>
              <label className="form-group">
                <span className="form-label">{t('phone')}</span>
                <input
                  className="form-input"
                  type="tel"
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </label>
              <label className="form-group">
                <span className="form-label">{t('profileBio')}</span>
                <textarea
                  className="form-input"
                  maxLength={300}
                  value={profile.bio}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                />
              </label>
              <div className="row">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? '…' : t('profileSave')}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)}>
                  {t('profileCancel')}
                </button>
              </div>
            </form>
          ) : (
            <dl className="profile-account-details">
              <div>
                <dt>{t('name')}</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>{t('phone')}</dt>
                <dd>{user.phone || t('profileNoPhone')}</dd>
              </div>
              <div>
                <dt>{t('profileAccountType')}</dt>
                <dd>{accountRoleLabel}</dd>
              </div>
              {user.bio && (
                <div>
                  <dt>{t('profileBio')}</dt>
                  <dd>{user.bio}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <section className="grid g4 profile-stats" aria-label={t('profileStatistics')}>
          <div className="glass-card pad profile-stat-card profile-stat-total">
            <span className="profile-stat-icon" aria-hidden="true">◉</span>
            <div className="sv profile-stat-value">{myReports.length}</div>
            <div className="sl">{t('myReports')}</div>
            <span className="profile-stat-caption">{t('profileTotalSent')}</span>
          </div>
          <div className="glass-card pad profile-stat-card profile-stat-resolved">
            <span className="profile-stat-icon" aria-hidden="true">✓</span>
            <div className="sv profile-stat-value">{resolvedReports}</div>
            <div className="sl">{t('resolved')}</div>
            <span className="profile-stat-caption">{t('profileResolvedCaption')}</span>
          </div>
          <div className="glass-card pad profile-stat-card profile-stat-progress">
            <span className="profile-stat-icon" aria-hidden="true">↗</span>
            <div className="sv profile-stat-value">{inProgressReports}</div>
            <div className="sl">{t('inProgress')}</div>
            <span className="profile-stat-caption">{t('profileProgressCaption')}</span>
          </div>
          <div className="glass-card pad profile-stat-card profile-stat-confirmations">
            <span className="profile-stat-icon" aria-hidden="true">♡</span>
            <div className="sv profile-stat-value">{confirmations}</div>
            <div className="sl">{t('confirmationsReceived')}</div>
            <span className="profile-stat-caption">{t('profileCommunitySupport')}</span>
          </div>
        </section>

        <section className="glass-card pad profile-impact-card">
          <div className="profile-section-heading">
            <div>
              <span className="profile-section-kicker">{t('profileImpactEyebrow')}</span>
              <h2>{t('profileImpactTitle')}</h2>
            </div>
            <span className="profile-impact-mark" aria-hidden="true">✳</span>
          </div>
          <p className="profile-impact-description">{t('profileImpactDescription')}</p>
          <div className="profile-progress-heading">
            <span>{t('profileResolutionRate')}</span>
            <strong>{resolutionRate}%</strong>
          </div>
          <div
            className="profile-progress-track"
            role="progressbar"
            aria-label={t('profileResolutionRate')}
            aria-valuenow={resolutionRate}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span style={{ width: `${resolutionRate}%` }} />
          </div>
          <div className="profile-impact-footer">
            <span>{resolvedReports} {t('resolved').toLocaleLowerCase(locale)}</span>
            <span>{myReports.length} {t('profileReportsLabel')}</span>
          </div>
        </section>

        <section className="glass-card pad profile-reports-card" id="profile-reports">
          <div className="profile-section-heading profile-reports-heading">
            <div>
              <span className="profile-section-kicker">{t('profileActivityEyebrow')}</span>
              <h2>{t('profileActivityTitle')}</h2>
              <p>{t('profileActivityDescription')}</p>
            </div>
            <span className="profile-report-count">
              {myReports.length} {t('profileReportsLabel')}
            </span>
          </div>
          {myReports.length ? (
            <div className="profile-report-list">
              {myReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onOpen={openReport}
                  locale={locale}
                  t={t}
                  categories={categories}
                />
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <span className="profile-empty-icon" aria-hidden="true">⌁</span>
              <h3>{t('profileEmptyTitle')}</h3>
              <p>{t('noPersonalReports')}</p>
              <Link className="btn btn-primary" to="/problems/create">{t('profileFirstReport')}</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
