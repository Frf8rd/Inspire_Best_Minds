import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import CaseCard from '../../components/CaseCard'
import { CATEGORIES } from '../../utils/constants'
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

export default function HomePage() {
  const { cases } = useCases()
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const activeSlideIndex = activeSlide % CHISINAU_IMAGES.length
  const activeImage = CHISINAU_IMAGES[activeSlideIndex]
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % CHISINAU_IMAGES.length)
    }, 5500)

    return () => window.clearInterval(intervalId)
  }, [])
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
