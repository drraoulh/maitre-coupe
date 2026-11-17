import { useEffect, type ReactNode } from 'react'
import { useApp } from '../context/AppContext'

/** En-tête de page : grand titre aligné à gauche, court texte, actions éventuelles. */
export function PageHero({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string
  title: string
  text?: ReactNode
  image?: string // conservé pour compatibilité, plus affiché
  children?: ReactNode
}) {
  const { settings } = useApp()
  useEffect(() => {
    document.title = `${title} — ${settings.name}, ${settings.city}`
  }, [title, settings.name, settings.city])

  return (
    <section className="page-hero">
      <div className="container">
        <p className="page-hero-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p className="page-hero-text">{text}</p>}
        {children}
      </div>
    </section>
  )
}
