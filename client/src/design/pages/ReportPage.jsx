import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import PageHeader from '../components/PageHeader.jsx';
import { CATEGORIES } from '../data/categories.js';
import { categoryLabel, serviceLabel } from '../data/translations.js';
import useLeafletMap from '../hooks/useLeafletMap.js';

const DEFAULT_LOCATION = [47.0245, 28.8322];

export default function ReportPage({ actions, t, locale, user, categories = CATEGORIES, onRequireAuth }) {
  const navigate = useNavigate();
  const mapElement = useRef(null);
  const map = useLeafletMap(mapElement, DEFAULT_LOCATION, 13);
  const marker = useRef(null);
  const videoElement = useRef(null);
  const cameraStream = useRef(null);
  const [position, setPosition] = useState(DEFAULT_LOCATION);
  const [form, setForm] = useState({ title: '', description: '', category: '', address: '' });
  const [locationSelected, setLocationSelected] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPhoto, setCameraPhoto] = useState('');
  const [cameraMessage, setCameraMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleReady = form.title.trim().length >= 3;
  const titleReadyRef = useRef(titleReady);

  useEffect(() => {
    titleReadyRef.current = titleReady;
  }, [titleReady]);

  useEffect(() => {
    const leafletMap = map.current;
    marker.current = L.marker(DEFAULT_LOCATION, {
      draggable: true,
      keyboard: true,
      title: 'Trage pinul verde sau selecteaz\u0103 un loc pe hart\u0103',
      icon: L.divIcon({
        html: '<span class="map-pin-marker"><i></i></span>',
        className: 'map-pin',
        iconSize: [30, 36],
        iconAnchor: [15, 34],
      }),
    }).addTo(leafletMap);
    marker.current.on('dragend', () => {
      if (!titleReadyRef.current) {
        marker.current.setLatLng(DEFAULT_LOCATION);
        setLocationMessage('Introdu mai întâi titlul sesizării.');
        return;
      }
      const next = marker.current.getLatLng();
      setPosition([next.lat, next.lng]);
      setLocationSelected(true);
    });
    leafletMap.on('click', (event) => {
      if (!titleReadyRef.current) {
        setLocationMessage('Introdu mai întâi titlul sesizării.');
        return;
      }
      setPosition([event.latlng.lat, event.latlng.lng]);
      setLocationSelected(true);
      setLocationMessage('');
    });
    return () => {
      marker.current?.remove();
      leafletMap.off();
    };
  }, [map]);

  useEffect(() => {
    const pin = marker.current;
    if (!pin) return;
    if (titleReady) pin.dragging.enable();
    else pin.dragging.disable();
  }, [map, titleReady]);

  useEffect(() => {
    marker.current?.setLatLng(position);
  }, [position]);

  useEffect(() => {
    if (cameraOpen && videoElement.current && cameraStream.current) {
      videoElement.current.srcObject = cameraStream.current;
      videoElement.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  useEffect(() => () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const setCurrentLocation = () => {
    if (!titleReady) {
      setLocationMessage('Introdu mai întâi titlul sesizării.');
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage('Geoloca\u021bia nu este disponibil\u0103 pe acest dispozitiv.');
      return;
    }
    setLocationMessage('Se determin\u0103 loca\u021bia...');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const next = [result.coords.latitude, result.coords.longitude];
        setPosition(next);
        setLocationSelected(true);
        map.current.setView(next, 16);
        setLocationMessage('Loca\u021bie actualizat\u0103. Po\u021bi muta pinul pentru precizie.');
      },
      () => setLocationMessage('Nu am putut accesa loca\u021bia. Mut\u0103 pinul direct pe hart\u0103.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const stopCamera = () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    cameraStream.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    setCameraMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera nu este disponibil\u0103. Deschide pagina prin HTTPS sau de pe localhost.');
      return;
    }
    try {
      cameraStream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setCameraOpen(true);
    } catch {
      setCameraMessage('Nu am putut porni camera. Verific\u0103 permisiunea pentru acest site.');
    }
  };

  const capturePhoto = () => {
    const video = videoElement.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraMessage('Camera se preg\u0103te\u0219te. Mai \u00eencearc\u0103 o dat\u0103.');
      return;
    }
    const scale = Math.min(1, 1440 / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraMessage('Fotografia nu a putut fi capturat\u0103.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCameraPhoto(canvas.toDataURL('image/jpeg', 0.68));
    setCameraMessage('');
    stopCamera();
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (form.title.trim().length < 3) {
      window.alert('Adaug\u0103 un titlu de cel pu\u021bin 3 caractere.');
      return;
    }
    if (!locationSelected) {
      window.alert('Selectează locul problemei pe hartă înainte de a alege categoria.');
      return;
    }
    if (!form.category || !categories[form.category]) {
      window.alert('Alege categoria sesizării.');
      return;
    }
    if (!cameraPhoto) {
      window.alert('Adaugă o fotografie pentru a putea trimite sesizarea.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await actions.create({
        title: form.title.trim(),
        cat: form.category,
        lat: position[0],
        lng: position[1],
        desc: form.description.trim(),
        address: form.address.trim(),
        cameraPhoto,
      });
      const message = created.duplicate
        ? `Sesizarea a fost asociată cu problema existentă ${created.parentCode || created.code || created.id}.`
        : t('reportSent')
          .replace('{id}', created.code || created.id)
          .replace('{service}', serviceLabel(locale, category?.[1] || '', t));
      window.alert(created.ai?.verdict === 'FLAGGED'
        ? `${message}\n\nSesizarea a fost marcată pentru verificare suplimentară.`
        : message);
      navigate('/map');
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories[form.category] ? form.category : '';
  const category = categories[selectedCategory] || CATEGORIES[selectedCategory] || ['', '', ''];
  const progress = [titleReady, locationSelected, Boolean(selectedCategory), Boolean(cameraPhoto)].filter(Boolean).length;

  return (
    <div className="report-page-complex">
      <PageHeader title={t('reportTitle')} subtitle={t('reportSubtitle')} />
      <div className="report-progress" aria-label={'Progresul sesiz\u0103rii'}>
        <div className="report-progress-track"><span style={{ width: `${(progress / 4) * 100}%` }} /></div>
        <span>{progress}/4 {'pa\u0219i preg\u0103ti'}</span>
      </div>

      <form className="report-layout" onSubmit={submitReport}>
        <div className="report-form-column">
          <section className="glass-card report-section-card">
            <div className="report-section-heading">
              <span className="report-step-number">01</span>
              <div>
                <span className="report-section-eyebrow">{'DETALIILE SESIZ\u0102RII'}</span>
                <h2>{'Introdu titlul problemei'}</h2>
              </div>
            </div>

            <label className="report-field-label" htmlFor="report-title">{t('title')}</label>
            <input
              id="report-title"
              className="form-input report-title-input"
              maxLength={120}
              required
              minLength={3}
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                setForm((current) => ({
                  ...current,
                  title,
                  ...(title.trim().length < 3 ? { category: '' } : {}),
                }));
                if (title.trim().length < 3) {
                  setLocationSelected(false);
                  setPosition(DEFAULT_LOCATION);
                }
              }}
              placeholder={t('exampleTitle')}
            />
            <div className="report-input-meta"><span>{'Un titlu clar ajut\u0103 echipele s\u0103 ac\u021bioneze mai repede.'}</span><span>{form.title.length}/120</span></div>

            <label className="report-field-label" htmlFor="report-description">{t('description')}</label>
            <textarea
              id="report-description"
              className="form-input report-description-input"
              rows={5}
              maxLength={800}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder={'Ce s-a \u00eent\u00e2mplat? Unde se vede problema? Adaug\u0103 detalii utile.'}
            />
            <div className="report-input-meta"><span>{'Men\u021bioneaz\u0103 repere vizibile sau riscuri pentru trec\u0103tori.'}</span><span>{form.description.length}/800</span></div>

            <label className="report-field-label" htmlFor="report-address">{'Adres\u0103 sau reper'} <span>{'op\u021bional'}</span></label>
            <input
              id="report-address"
              className="form-input"
              maxLength={160}
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder={'Ex.: Strada Bucure\u0219ti, l\u00e2ng\u0103 sta\u021bia de autobuz'}
            />
          </section>

          <section className={`glass-card report-section-card report-category-section ${!titleReady || !locationSelected ? 'is-locked' : ''}`}>
            <div className="report-section-heading">
              <span className="report-step-number">03</span>
              <div>
                <span className="report-section-eyebrow">CATEGORIA</span>
                <h2>Alege categoria sesizării</h2>
                <p>{!titleReady ? 'Introdu mai întâi titlul sesizării.' : !locationSelected ? 'Alege mai întâi locul problemei pe hartă.' : 'Categoria ajută la direcționarea sesizării către serviciul potrivit.'}</p>
              </div>
            </div>
            <div className="report-category-grid">
              {Object.entries(categories).map(([key, item]) => (
                <button
                  className={`report-category-option ${selectedCategory === key ? 'is-selected' : ''}`}
                  key={key}
                  type="button"
                  aria-pressed={selectedCategory === key}
                  disabled={!titleReady || !locationSelected}
                  onClick={() => setForm({ ...form, category: key })}
                >
                  <span className="report-category-code">{item[2]}</span>
                  <span>{categoryLabel(locale, key, item[0])}</span>
                  <i aria-hidden="true">{selectedCategory === key ? '\u2713' : '+'}</i>
                </button>
              ))}
            </div>
            <div className="report-routing-note">
              <span className="report-routing-icon" aria-hidden="true">&#8599;</span>
              <span>{t('sentTo')} <strong>{serviceLabel(locale, category[1], t)}</strong></span>
            </div>
          </section>

          <section className="glass-card report-section-card report-photo-section">
            <div className="report-section-heading">
              <span className="report-step-number">04</span>
              <div>
                <span className="report-section-eyebrow">{'DOVAD\u0102 FOTO'}</span>
                <h2>{'Arat\u0103-ne problema'}</h2>
                <p>{'Fotografia se face direct cu camera. Nu po\u021bi alege imagini din galerie.'}</p>
              </div>
            </div>
            {cameraOpen ? (
              <div className="report-camera-view">
                <video ref={videoElement} autoPlay playsInline muted aria-label={'Previzualizare camer\u0103'} />
                <div className="report-camera-controls">
                  <button className="btn btn-secondary" type="button" onClick={stopCamera}>{'Anuleaz\u0103'}</button>
                  <button className="btn btn-primary" type="button" onClick={capturePhoto}>
                    <span aria-hidden="true">&#9679;</span> {'Captureaz\u0103 fotografia'}
                  </button>
                </div>
              </div>
            ) : cameraPhoto ? (
              <div className="report-photo-preview">
                <img src={cameraPhoto} alt={'Fotografia capturat\u0103 pentru sesizare'} />
                <div className="report-photo-preview-overlay">
                  <span>{'Fotografie capturat\u0103'}</span>
                  <button type="button" className="btn btn-secondary" onClick={() => setCameraPhoto('')}>{'F\u0103 alt\u0103 fotografie'}</button>
                </div>
              </div>
            ) : (
              <div className="report-camera-empty">
                <span className="report-camera-symbol" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h8L18 8h2v11H4V8Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.6" /></svg>
                </span>
                <strong>{'Adaug\u0103 o fotografie clar\u0103'}</strong>
                <span>{'\u021atine camera stabil\u0103 \u0219i surprinde zona din apropiere.'}</span>
                <button className="btn btn-secondary" type="button" onClick={openCamera}>Deschide camera</button>
              </div>
            )}
            {cameraMessage && <p className="report-inline-message" role="status">{cameraMessage}</p>}
          </section>
        </div>

        <aside className="report-side-column">
          <section className="glass-card report-section-card report-location-section">
            <div className="report-section-heading">
              <span className="report-step-number">02</span>
              <div>
                <span className="report-section-eyebrow">{'UNDE SE AFL\u0102?'}</span>
                <h2>{'Fixeaz\u0103 locul exact'}</h2>
              </div>
            </div>
            <button className="report-location-button" type="button" onClick={setCurrentLocation} disabled={!titleReady}>
              <span aria-hidden="true">&#8982;</span>{t('useMyLocation')}
            </button>
            {!titleReady && <p className="report-inline-message">Introdu titlul sesizării pentru a activa selectarea locației.</p>}
            {locationMessage && <p className="report-inline-message" role="status">{locationMessage}</p>}
            <div id="pick" className="report-map" ref={mapElement} aria-label={'Hart\u0103 pentru selectarea loca\u021biei'} />
            <p className="report-map-hint">{titleReady ? 'Alege locul problemei: mută pinul verde sau atinge punctul dorit pe hartă.' : 'După introducerea titlului, alege locul problemei pe hartă.'}</p>
            <div className="report-coordinates">
              <span><i /> {'Coordonate selectate'}</span>
              <strong>{locationSelected ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Alege un loc pe hartă'}</strong>
            </div>
          </section>

          <section className="report-review-card">
            <span className="report-review-eyebrow">{'VERIFICARE RAPID\u0102'}</span>
            <h3>{form.title.trim() || 'Titlul sesiz\u0103rii va ap\u0103rea aici'}</h3>
            <p>{selectedCategory ? categoryLabel(locale, selectedCategory, category[0]) : 'Alege categoria'} {'\u00b7'} {cameraPhoto ? 'cu fotografie' : 'f\u0103r\u0103 fotografie'}</p>
            <div className="report-review-location"><span aria-hidden="true">&#8982;</span>{form.address.trim() || `${position[0].toFixed(3)}, ${position[1].toFixed(3)}`}</div>
            <button className="btn btn-primary report-submit-button" type="submit" disabled={submitting || !titleReady || !locationSelected || !selectedCategory || !cameraPhoto}>
              {submitting ? 'Se trimite...' : t('submitReport')}
              <span aria-hidden="true">&#8594;</span>
            </button>
            <small>Prin trimitere, sesizarea ajunge la serviciul responsabil.</small>
          </section>
        </aside>
      </form>
    </div>
  );
}
