import { useEffect, type ReactNode } from 'react'
import { useApp } from '../context/AppContext'

/** Bandeau d'en-tête des pages : photo du salon en fond, titre et sous-titre. */
export function PageHero({
  eyebrow,
  title,
  text,
  image = '/images/salon-interieur.webp',
  children,
}: {
  eyebrow: string
  title: string
  text?: ReactNode
  image?: string
  children?: ReactNode
}) {
  const { settings } = useApp()
  useEffect(() => {
    document.title = `${title} — ${settings.name}, ${settings.city}`
  }, [title, settings.name, settings.city])

  return (
    <section className="page-hero">
      <img className="page-hero-bg" src={image} alt="" />
      <div className="page-hero-overlay" />
      <div className="container page-hero-content">
        <span className="page-hero-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
        {children}
      </div>
      <svg className="hero-wave" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 48h1440V18c-160 18-360 30-720 14S160 6 0 22Z" fill="currentColor" />
      </svg>
    </section>
  )
}
