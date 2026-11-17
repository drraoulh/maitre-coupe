import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { EXTRAS, UNIVERS } from '../lib/univers'
import { useLoad } from '../lib/useLoad'
import { DAY_NAMES, formatDuration, formatPrice, toMinutes, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Avatar, Img } from '../components/ui'

export default function Home() {
  const { settings } = useApp()
  const services = useLoad(() => api.listServices())
  const styles = useLoad(() => api.listHairstyles())
  const posts = useLoad(() => api.listPosts())

  useEffect(() => {
    document.title = `${settings.name} — Coiffure, beauté et bien-être à ${settings.city}`
  }, [settings.name, settings.city])

  const now = new Date()
  const today = settings.hours[now.getDay()]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isOpen = !today.closed && nowMin >= toMinutes(today.open) && nowMin < toMinutes(today.close)
  const nextOpen = settings.hours[(now.getDay() + (nowMin >= toMinutes(today.close) ? 1 : 0)) % 7].open
  const featured = (services.data ?? []).filter((s) => s.active).slice(0, 6)
  const gallery = (styles.data ?? []).slice(0, 6)
  const latest = (posts.data ?? []).slice(0, 3)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.name} ${settings.address} ${settings.city}`)}`
  const [first, ...rest] = settings.name.split(' ')

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <p className={`hero-status ${isOpen ? 'is-open' : ''}`}>
              <span className="dot" aria-hidden="true" />
              {isOpen ? `Ouvert aujourd’hui jusqu’à ${today.close}` : `Fermé pour le moment, ouverture à ${nextOpen}`}
            </p>
            <h1 className="wordmark" aria-label={settings.name}>
              <span>{first}</span>
              {rest.length > 0 && <span>{rest.join(' ')}</span>}
            </h1>
            <p className="hero-lede">
              {settings.tagline}. Coiffure, soins du visage, hammam et massages à Nkolmesseng, face à Guiko Center.
            </p>
            <div className="hero-actions">
              <Link to="/reserver" className="btn btn-gold btn-lg">Réserver un soin</Link>
              {settings.whatsapp && (
                <a className="btn btn-quiet btn-lg" href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name}, je souhaite prendre rendez-vous.`)} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" /> WhatsApp
                </a>
              )}
            </div>
            {settings.google_rating > 0 && (
              <a className="hero-rating" href={settings.google_url || '#'} target="_blank" rel="noreferrer">
                <span className="stars" aria-hidden="true">★★★★★</span>
                {settings.google_rating.toLocaleString('fr-FR')} sur 5 d’après {settings.google_reviews} avis Google
              </a>
            )}
          </div>
          <figure className="hero-window">
            <img src={settings.hero_image || '/images/coupe-enfant.webp'} alt={`Une coupe enfant chez ${settings.name}`} />
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Ce que nous faisons</h2>
          <ul className="index-list">
            {UNIVERS.map((u) => (
              <li key={u.name}>
                <Link to={`/prestations?univers=${encodeURIComponent(u.name)}`} className="index-row">
                  <span className="index-name">{u.name}</span>
                  <span className="index-text">{u.text}</span>
                  <span className="index-go" aria-hidden="true"><Icon name="arrow" size={18} /></span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="index-more">
            Et aussi :{' '}
            {EXTRAS.map((e, i) => (
              <span key={e.name}>
                <Link to={`/prestations?univers=${encodeURIComponent(e.name)}`}>{e.name.toLowerCase()}</Link>
                {i < EXTRAS.length - 2 ? ', ' : i === EXTRAS.length - 2 ? ' et ' : '.'}
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="container photo-band" aria-label="Le salon">
        <img src="/images/salon-interieur.webp" alt={`L’espace coiffure de ${settings.name}`} loading="lazy" />
        <div className="photo-band-caption">
          <p>Le plafond bleu ciel, les fauteuils rouges : bienvenue dans le salon.</p>
          <Link to="/salon" className="text-link">Découvrir le salon</Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">À la carte</h2>
              <Link to="/prestations" className="text-link">Tous les tarifs</Link>
            </div>
            <ul className="menu-list">
              {featured.map((s) => (
                <li key={s.id}>
                  <Link to={`/reserver?service=${s.id}`} className="menu-row">
                    <span className="menu-name">{s.name}</span>
                    <span className="menu-dots" aria-hidden="true" />
                    <span className="menu-meta">{formatDuration(s.duration)}</span>
                    <span className="menu-price">{s.price > 0 ? formatPrice(s.price, settings.currency) : 'Sur devis'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Derniers modèles</h2>
              <Link to="/galerie" className="text-link">Toute la galerie</Link>
            </div>
            <div className="masonry">
              {gallery.map((h) => (
                <Link to="/galerie" key={h.id} className="tile">
                  <Img src={h.image_url} alt={h.title} />
                  <div className="tile-caption">
                    <strong>{h.title}</strong>
                    {h.price_from != null && <span>dès {formatPrice(h.price_from, settings.currency)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Dans la communauté</h2>
              <Link to="/communaute" className="text-link">Voir le fil</Link>
            </div>
            <div className="grid grid-3">
              {latest.map((p) => (
                <Link to="/communaute" key={p.id} className="mini-post">
                  {p.image_url && <Img src={p.image_url} alt="" className="mini-post-img" />}
                  <div className="post-author">
                    <Avatar name={p.author.full_name} url={p.author.avatar_url} size={28} />
                    <strong>{p.author.full_name}</strong>
                  </div>
                  <p className="clamp-3">{p.content}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container visit">
          <div>
            <h2 className="section-title">Venir au salon</h2>
            <p className="visit-address">
              {settings.address}
              <br />
              {settings.city}
            </p>
            <div className="visit-actions">
              <a className="btn btn-outline" href={mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" /> Itinéraire</a>
              <a className="btn btn-quiet" href={`tel:${settings.phone.replace(/\s/g, '')}`}><Icon name="phone" /> {settings.phone}</a>
            </div>
          </div>
          <div>
            <h3 className="visit-sub">Horaires</h3>
            <ul className="hours">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className={d === now.getDay() ? 'today' : ''}>
                  <span>{DAY_NAMES[d]}</span>
                  <span>{settings.hours[d].closed ? 'Fermé' : `${settings.hours[d].open} – ${settings.hours[d].close}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
