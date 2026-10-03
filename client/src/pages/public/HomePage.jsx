import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import StatusBadge from '../../components/StatusBadge'
import { fmtRelativeTime } from '../../utils/format'
import './HomePage.css'

const CHISINAU_IMAGES = [
  {
    src: '/images/chisinau/Pasted%20Image-hires.png',
    alt: 'City hall building in Chișinău',
    label: 'Centru',
  },
  {
    src: '/images/chisinau/chisinau-morning.jpg',
    alt: 'Panoramic morning view over Chișinău',
    label: 'Panoramă',
    credit: 'Adli Wahid · CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Good_Morning_Chisinau_(237826603).jpeg',
  },
  {
    src: '/images/chisinau/chisinau-triumphal-arch.jpg',
    alt: 'Triumphal Arch in central Chișinău',
    label: 'Arcul de Triumf',
    credit: 'Photobank MD · CC0',
    source: 'https://commons.wikimedia.org/wiki/File:%D0%A2%D1%80%D0%B8%D1%83%D0%BC%D1%84%D0%B0%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F_%D0%90%D1%80%D0%BA%D0%B0,_%D0%9A%D0%B8%D1%88%D0%B8%D0%BD%D0%B5%D0%B2,_%D0%A0%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0_%D0%9C%D0%BE%D0%BB%D0%B4%D0%BE%D0%B2%D0%B0_Arcul_de_Triumf,_Chisinau,_Republica_Moldova_Arch_of_Triumph,_Chisinau,_Republic_of_Moldova_(51160304626).jpg',
  },
  {
    src: '/images/chisinau/chisinau-stefan-cel-mare.jpg',
    alt: 'Ștefan cel Mare Boulevard in Chișinău',
    label: 'Ștefan cel Mare',
    credit: 'Andrew Milligan sumo · CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Stefan_cel_Mare_si_Sfant_Boulevard_(2),_Chi%C8%99in%C4%83u,_Moldova_(46881346701).jpg',
  },
  {
    src: '/images/chisinau/chisinau-dendrarium.jpg',
    alt: 'Chișinău skyline from the Dendrarium park',
    label: 'Dendrarium',
    credit: 'Taras Solovei · CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Chisinau_dendrarium_-_skyline_and_grass_field.jpg',
  },
]

const CATEGORY_LABELS_RO = {
  pothole: 'Groapă',
  lighting: 'Iluminat stradal',
  parking: 'Parcare neregulamentară',
  trash: 'Deșeuri',
  sidewalk: 'Trotuar',
  other: 'Altele',
}

export default function HomePage() {
  const { cases } = useCases()
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [now, setNow] = useState(Date.now)
  const activeSlideIndex = activeSlide % CHISINAU_IMAGES.length
  const activeImage = CHISINAU_IMAGES[activeSlideIndex]
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % CHISINAU_IMAGES.length)
    }, 5500)

    return () => window.clearInterval(intervalId)
  }, [])
  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])
  const latestCases = [...cases]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
  const stats = [
    { label: 'Raportări comunitare', value: cases.length, detail: 'înregistrate în oraș' },
    { label: 'Rezolvate', value: cases.filter((caseItem) => caseItem.status === 'resolved').length, detail: 'probleme soluționate' },
    { label: 'În lucru', value: cases.filter((caseItem) => caseItem.status === 'in_progress').length, detail: 'în curs de rezolvare' },
    { label: 'Confirmări', value: cases.reduce((total, caseItem) => total + caseItem.votes.length, 0), detail: 'de la locuitori' },
  ]

  return (
    <div className="page home-page">
      <section aria-label="Chișinău city gallery" className="home-page__hero">
        <img
          key={activeImage.src}
          alt={activeImage.alt}
          className="home-page__hero-image"
          src={activeImage.src}
          title={activeImage.credit ? `Photo: ${activeImage.credit} · ${activeImage.source}` : undefined}
        />
        <div className="home-page__hero-shade" />
        <div className="home-page__hero-copy">
          <p>CHIȘINĂU · COMMUNITY POWERED</p>
          <h1>Small actions.<br />A better city.</h1>
        </div>
      </section>
      <section aria-labelledby="home-intro-heading" className="home-page__intro">
        <span aria-hidden="true" className="home-page__intro-mark">SMK</span>
        <div>
          <p className="home-page__eyebrow">O comunitate. Un oraș mai bun.</p>
          <h2 id="home-intro-heading">Spune ce nu funcționează. Împreună, facem Chișinăul mai bun.</h2>
          <p className="home-page__intro-copy">
            Raportează probleme din cartierul tău — gropi, iluminat stradal defect, gunoi,
            trotuare deteriorate sau parcări neregulamentare — și urmărește progresul rezolvării lor.
          </p>
        </div>
      </section>
      <section aria-label="Statistici comunitare" className="home-page__stats">
        {stats.map((stat) => (
          <div className="home-page__stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.detail}</small>
          </div>
        ))}
      </section>
      <section aria-labelledby="latest-reports-heading" className="home-page__latest-reports">
        <div className="home-page__latest-heading">
          <div>
            <p className="home-page__eyebrow"><span /> Comunitate</p>
            <h2 id="latest-reports-heading">Ultimele raportări</h2>
          </div>
          <button className="home-page__all-reports" onClick={() => navigate('/map')}>Vezi toate <span aria-hidden="true">→</span></button>
        </div>
        {latestCases.length ? (
          <div className="home-page__report-cards">
            {latestCases.map((caseItem) => (
              <button
                aria-label={`Deschide raportarea: ${caseItem.title}`}
                className="home-page__report-card"
                key={caseItem.id}
                onClick={() => navigate(`/map?case=${encodeURIComponent(caseItem.id)}`)}
              >
                {caseItem.photo ? (
                  <img alt="" className="home-page__report-photo" src={caseItem.photo} />
                ) : (
                  <div aria-label="Nu a fost atașată o fotografie" className="home-page__report-photo home-page__report-photo--empty" role="img">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <circle cx="8.5" cy="9" r="1.5" />
                      <path d="m21 15-5-5L5 20" />
                    </svg>
                    <span>Fără fotografie</span>
                  </div>
                )}
                <div className="home-page__report-content">
                  <span className="home-page__report-category">{CATEGORY_LABELS_RO[caseItem.category] || CATEGORY_LABELS_RO.other}</span>
                  <h3>{caseItem.title}</h3>
                  <div className="home-page__report-meta">
                    {caseItem.status === 'new' ? (
                      <time className="home-page__report-age" dateTime={caseItem.createdAt}>
                        {fmtRelativeTime(caseItem.createdAt, now)}
                      </time>
                    ) : <StatusBadge status={caseItem.status} />}
                    <span className="home-page__confirmations">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8a3 3 0 0 1 2 4l-1 4h6a3 3 0 0 1 3 4l-1.5 6a3 3 0 0 1-3 2H7" />
                      </svg>
                      {caseItem.votes.length} confirmări
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="home-page__reports-empty">Nu există raportări încă.</p>
        )}
      </section>
    </div>
  )
}
