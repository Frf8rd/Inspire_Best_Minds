import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import PageHeader from '../components/PageHeader.jsx';
import ReportCard from '../components/ReportCard.jsx';
import { CATEGORIES, ISSUE_IMAGES, STATUSES } from '../data/categories.js';
import { categoryLabel, statusLabel } from '../data/translations.js';
import { formatDate } from '../utils/date.js';
import useLeafletMap from '../hooks/useLeafletMap.js';
import { Link, useSearchParams } from 'react-router-dom';

const MAP_CENTER = [47.0245, 28.8322];

export default function MapPage({ reports, categories = CATEGORIES, openReport, locale, t }) {
  const mapElement = useRef(null);
  const map = useLeafletMap(mapElement, MAP_CENTER, 12);
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedReportId, setSelectedReportId] = useState(() => searchParams.get('report'));
  const filteredReports = useMemo(
    () => reports.filter((report) => (
      (!statusFilter || report.st === statusFilter)
      && (!categoryFilter || report.cat === categoryFilter)
    )),
    [reports, statusFilter, categoryFilter],
  );
  const selectedReport = filteredReports.find((report) => report.id === selectedReportId);
  const selectReport = useCallback((report) => {
    setSelectedReportId(report.id);
    setSearchParams({ report: report.id }, { replace: true });
  }, [setSearchParams]);
  const closeSelectedReport = useCallback(() => {
    setSelectedReportId(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (!selectedReport) return;
    const leafletMap = map.current;
    if (
      leafletMap
      && Number.isFinite(Number(selectedReport.lat))
      && Number.isFinite(Number(selectedReport.lng))
    ) {
      leafletMap.flyTo(
        [Number(selectedReport.lat), Number(selectedReport.lng)],
        Math.max(leafletMap.getZoom(), 15),
        { duration: 0.7 },
      );
    }
  }, [map, selectedReport]);

  useEffect(() => {
    const markers = L.layerGroup().addTo(map.current);
    filteredReports.forEach((report) => {
      const preview = document.createElement('div');
      preview.className = 'map-marker-preview';
      const image = document.createElement('img');
      image.src = report.cameraPhoto || ISSUE_IMAGES[report.cat] || ISSUE_IMAGES.groapa;
      image.alt = '';
      image.loading = 'lazy';
      const copy = document.createElement('div');
      copy.className = 'map-marker-preview-copy';
      const title = document.createElement('strong');
      title.textContent = report.title;
      const description = document.createElement('span');
      description.textContent = report.desc || report.title;
      copy.append(title, description);
      preview.append(image, copy);

      L.circleMarker([report.lat, report.lng], {
        radius: report.id === selectedReportId ? 12 : 9,
        color: '#fff',
        weight: report.id === selectedReportId ? 3 : 2,
        fillColor: STATUSES[report.st]?.[2] || '#6b7280',
        fillOpacity: 1,
      })
        .addTo(markers)
        .bindTooltip(preview, {
          direction: 'top',
          offset: [0, -12],
          className: 'map-marker-tooltip',
          opacity: 1,
        })
        .on('click', () => selectReport(report));
    });
    return () => markers.remove();
  }, [filteredReports, map, selectReport, selectedReportId]);

  useEffect(() => {
    if (
      reports.length > 0
      && selectedReportId
      && !filteredReports.some((report) => report.id === selectedReportId)
    ) {
      setSelectedReportId(null);
    }
  }, [filteredReports, reports.length, selectedReportId]);

  return (
    <div className="map-page">
      <PageHeader
        title={t('mapTitle')}
        subtitle={t('mapSubtitle')}
      />
      <div className="map-toolbar">
        <div className="map-filters">
          <label>
            <span>{t('mapStatusFilter')}</span>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">{t('allStatuses')}</option>
              {Object.entries(STATUSES).map(([key, status]) => (
                <option key={key} value={key}>{statusLabel(locale, key, status[0])}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('mapCategoryFilter')}</span>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">{t('allCategories')}</option>
              {Object.entries(categories).map(([key, category]) => (
                <option key={key} value={key}>{categoryLabel(locale, key, category[0])}</option>
              ))}
            </select>
          </label>
        </div>
        <Link className="btn btn-primary map-report-button" to="/problems/create">
          <span aria-hidden="true">+</span>
          {t('report')}
        </Link>
      </div>
      <div className="map-workspace">
        <section className="glass-card map-card" aria-label={t('mapCity')}>
          <div className="map-card-heading">
            <span className="map-location-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 10.2c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </span>
            <div className="map-location-copy">
              <h2>{t('mapCity')}</h2>
              <p>{t('mapCityDescription')}</p>
            </div>
            <span className="map-problem-count">
              <span />
              {filteredReports.length} {t('problems')}
            </span>
          </div>
          <div id="map" ref={mapElement} aria-label={t('mapCity')} />
          {selectedReport && (
            <article className="map-selected-report" aria-live="polite">
              <img
                src={selectedReport.cameraPhoto || ISSUE_IMAGES[selectedReport.cat] || ISSUE_IMAGES.groapa}
                alt=""
                className="map-selected-report-image"
              />
              <div className="map-selected-report-copy">
                <span className="map-selected-report-category">
                  {categoryLabel(locale, selectedReport.cat, categories[selectedReport.cat]?.[0] || CATEGORIES[selectedReport.cat]?.[0] || '')}
                </span>
                <h3>{selectedReport.title}</h3>
                <small className="map-selected-report-author">
                  {t('name')}: {selectedReport.by || t('citizen')}
                </small>
                <p>{selectedReport.desc || selectedReport.title}</p>
                <div className="map-selected-report-meta">
                  <small>{formatDate(selectedReport.date, locale)}</small>
                  <span className={`status-badge ${STATUSES[selectedReport.st]?.[1] || 'pending'}`}>
                    {statusLabel(locale, selectedReport.st, STATUSES[selectedReport.st]?.[0] || 'Status necunoscut')}
                  </span>
                </div>
                <div className="map-selected-report-location">
                  <span>{t('location')}</span>
                  <strong>{selectedReport.address || `${Number(selectedReport.lat).toFixed(5)}, ${Number(selectedReport.lng).toFixed(5)}`}</strong>
                </div>
                <button
                  className="btn btn-secondary map-selected-report-details"
                  type="button"
                  onClick={() => openReport(selectedReport.id)}
                >
                  {t('completeDetails')}
                </button>
              </div>
              <button
                className="map-selected-report-close"
                type="button"
                onClick={closeSelectedReport}
                aria-label={t('close')}
              >×</button>
            </article>
          )}
          <div className="map-legend" aria-label={t('mapLegend')}>
            {Object.entries(STATUSES).map(([key, status]) => (
              <span key={key}>
                <i style={{ backgroundColor: status[2] }} />
                {statusLabel(locale, key, status[0])}
              </span>
            ))}
          </div>
        </section>
        <aside className="glass-card pad map-report-panel" aria-label={t('latestReports')}>
          <div className="map-report-heading">
            <div>
              <span>{t('mapActivityEyebrow')}</span>
              <h2>{t('latestReports')}</h2>
            </div>
            <span className="map-report-count">{filteredReports.length}</span>
          </div>
          <div className="map-report-list">
            {filteredReports.length ? filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onOpen={() => selectReport(report)}
                selected={report.id === selectedReportId}
                locale={locale}
                t={t}
                categories={categories}
              />
            )) : <p className="map-empty-state">{t('noReports')}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
