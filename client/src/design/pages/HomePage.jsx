import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge.jsx';
import { CATEGORIES, HERO_SLIDES, ISSUE_IMAGES } from '../data/categories.js';
import { categoryLabel } from '../data/translations.js';
import { formatDate } from '../utils/date.js';
import { Link } from 'react-router-dom';

export default function HomePage({ reports, categories = CATEGORIES, onSelectReport, locale, t }) {
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const latestReports = [...reports].sort((a, b) => b.date - a.date).slice(0, 3);
  const popularReports = [...reports].sort((a, b) => b.conf - a.conf || b.date - a.date).slice(0, 5);
  const topContributors = Object.entries(reports.reduce((contributors, report) => {
    const name = typeof report.by === 'string' ? report.by.trim() : '';
    if (!name || name.toLocaleLowerCase() === 'cetățean') return contributors;
    contributors[name] = (contributors[name] || 0) + 1;
    return contributors;
  }, {}))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, locale))
    .slice(0, 5);
  const activeCount = reports.filter((report) => report.st !== 'done').length;
  const inProgressCount = reports.filter((report) => report.st === 'progress').length;
  const resolvedCount = reports.filter((report) => report.st === 'done').length;
  const formatCount = (value) => value.toLocaleString(locale === 'ru' ? 'ru-RU' : 'ro-RO');

  return (
    <>
      <section className="home-photo-hero" aria-label={t('cityPhotos')}>
        <div className="home-photo-stack">
          {HERO_SLIDES.map((slide, index) => (
            <img
              key={slide.src}
              className={`home-photo-slide ${index === activeSlide ? 'is-active' : ''}`}
              src={slide.src}
              alt={slide.alt}
              aria-hidden={index !== activeSlide}
            />
          ))}
        </div>
        <div className="home-photo-shade" />
        <div className="home-photo-caption">
          <span className="home-photo-eyebrow">{t('cityCommunity')}</span>
          <h2>{t('heroTitle').split('|').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2>
          <p>{t('heroDescription')}</p>
          <Link to="/problems/create">{t('reportProblem')} <span aria-hidden="true">→</span></Link>
        </div>
        <div className="home-photo-dots" role="group" aria-label={t('cityPhotos')}>
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              className={`home-photo-dot ${index === activeSlide ? 'is-active' : ''}`}
              type="button"
              aria-label={`${t('cityPhotos')} ${index + 1}`}
              aria-pressed={index === activeSlide}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>

      <div className="home-dashboard-grid">
        <div className="home-primary-column">
          <section className="panel-card home-impact-panel">
            <div className="home-impact-copy">
              <span className="panel-eyebrow">{t('communityBetter')}</span>
              <h2>{t('impactTitle')}</h2>
              <p>{t('impactDescription')}</p>
              <div className="home-impact-topics">
                {[t('roadsSidewalks'), t('streetLighting'), t('cleanlinessParking')].map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            </div>

            <div className="home-impact-stats" aria-label={t('totalReports')}>
              {[
                [t('totalReports'), reports.length, t('communityReported'), 'total'],
                [t('active'), activeCount, t('awaitingResolution'), 'active'],
                [t('inProgress'), inProgressCount, t('handledByInstitutions'), 'progress'],
                [t('resolved'), resolvedCount, t('markedResolved'), 'resolved'],
              ].map(([label, value, detail, tone]) => (
                <article className={`home-impact-stat home-impact-stat-${tone}`} key={tone}>
                  <span className="home-impact-stat-label">{label}</span>
                  <strong>{formatCount(value)}</strong>
                  <span className="home-impact-stat-detail">{detail}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-card latest-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">{t('cityUpdates')}</span>
                <h2>{t('latestReports')}</h2>
              </div>
              <Link className="panel-link" to="/map">{t('seeAll')}</Link>
            </div>
            <div className="recent-report-grid">
              {latestReports.map((report) => (
                <button
                  className="recent-report-card"
                  key={report.id}
                  type="button"
                  onClick={() => onSelectReport(report.id)}
                  aria-label={report.title}
                >
                  <img
                    src={ISSUE_IMAGES[report.cat] || ISSUE_IMAGES.groapa}
                    alt=""
                    loading="lazy"
                  />
                  <span className="recent-report-copy">
                    <span className="recent-report-description">{report.desc || report.title}</span>
                    <span className="recent-report-meta">
                      <small>{categoryLabel(locale, report.cat, categories[report.cat]?.[0] || CATEGORIES[report.cat]?.[0] || '')} · {formatDate(report.date, locale)}</small>
                      <StatusBadge status={report.st} locale={locale} />
                    </span>
                  </span>
                </button>
              ))}
              {!latestReports.length && <p className="empty-state">{t('noReports')}</p>}
            </div>
          </section>
        </div>

        <aside className="home-aside">
          <section className="panel-card popular-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">{t('fromCommunity')}</span>
                <h2>{t('popularReports')}</h2>
              </div>
            </div>
            <div className="popular-report-list">
              {popularReports.map((report) => (
                <button
                  className="popular-report-row"
                  key={report.id}
                  type="button"
                  onClick={() => onSelectReport(report.id)}
                >
                  <img src={ISSUE_IMAGES[report.cat] || ISSUE_IMAGES.groapa} alt="" loading="lazy" />
                  <span className="popular-report-copy">
                    <strong>{report.title}</strong>
                    <small>{report.conf} {t('confirmations')}</small>
                  </span>
                  <StatusBadge status={report.st} locale={locale} />
                </button>
              ))}
              {!popularReports.length && <p className="empty-state">{t('noReports')}</p>}
            </div>
            <Link className="panel-outline-link" to="/map">{t('allReports')}</Link>
          </section>

          <section className="panel-card contributors-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">{t('communityRecognition')}</span>
                <h2>{t('topContributors')}</h2>
              </div>
            </div>
            <div className="contributor-list">
              {topContributors.map((contributor, index) => (
                <div className="contributor-row" key={contributor.name}>
                  <span className="contributor-rank">{index + 1}</span>
                  <span className="contributor-avatar" aria-hidden="true">
                    {contributor.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase(locale)}
                  </span>
                  <span className="contributor-copy">
                    <strong>{contributor.name}</strong>
                    <small>{formatCount(contributor.count)} {t('reportsSent')}</small>
                  </span>
                  {index === 0 && <span className="contributor-top-label">{t('topContributor')}</span>}
                </div>
              ))}
              {!topContributors.length && <p className="empty-state">{t('noContributors')}</p>}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
