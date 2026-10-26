import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { UNIVERS } from '../lib/univers'
import { useLoad } from '../lib/useLoad'
import { DAY_NAMES, formatDuration, formatPrice, toMinutes, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Avatar, Img } from '../components/ui'

export default function Home() {
  const { settings } = useApp()
  const services = useLoad(() => api.listServices())
  const styles = useLoad(() => api.listHairstyles())
  const posts = useLoad(() => api.listPosts())

  const now = new Date()
  const today = settings.hours[now.getDay()]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isOpen = !today.closed && nowMin >= toMinutes(today.open) && nowMin < toMinutes(today.close)
  const featured = (services.data ?? []).filter((s) => s.active).slice(0, 6)
  const gallery = (styles.data ?? []).slice(0, 6)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.name} ${settings.address} ${settings.city}`)}`

  return (
    <>
      <section className={`hero ${settings.hero_image ? '' : 'hero-plain'}`} style={settings.hero_image ? { backgroundImage: `url(${settings.hero_image})` } : undefined}>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className={`pill ${isOpen ? 'pill-open' : 'pill-closed'}`}>
            <span className="dot" /> {isOpen ? `Ouvert · jusqu’à ${today.close}` : `Fermé · ouvre à ${settings.hours[(now.getDay() + (nowMin >= toMinutes(today.close) ? 1 : 0)) % 7].open}`}
          </span>
          <span className="hero-eyebrow">Salon de coiffure · Institut de beauté · Bien-être</span>
          <h1>{settings.name}</h1>
          <p className="hero-tagline">
            <Icon name="pin" size={18} /> {settings.address}, {settings.city}
          </p>
          <div className="hero-actions">
            <Link to="/reserver" className="btn btn-gold btn-lg">
              <Icon name="calendar" /> Prendre rendez-vous
            </Link>
            {settings.whatsapp && (
              <a className="btn btn-outline btn-lg" href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name}, je souhaite prendre rendez-vous.`)} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" /> WhatsApp
              </a>
            )}
          </div>
          {settings.google_rating > 0 && (
            <a className="rating" href={settings.google_url || '#'} target="_blank" rel="noreferrer">
              <span className="stars" aria-hidden="true">★★★★★</span>
              <strong>{settings.google_rating.toLocaleString('fr-FR')}/5</strong>
              <span>· {settings.google_reviews} avis Google</span>
            </a>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos univers</span>
              <h2>Prenez soin de vous, de la tête aux pieds</h2>
            </div>
            <Link to="/prestations" className="link-arrow">Soins & tarifs <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="univers-grid">
            {UNIVERS.map((u) => (
              <Link key={u.name} to={`/prestations?univers=${encodeURIComponent(u.name)}`} className="univers-card">
                <span className="univers-icon"><Icon name={u.icon} size={26} /></span>
                <strong>{u.name}</strong>
                <span className="muted small">{u.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">À la carte</span>
                <h2>Nos soins du moment</h2>
              </div>
              <Link to="/prestations" className="link-arrow">Tous les tarifs <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="grid grid-3">
              {featured.map((s) => (
                <article key={s.id} className="card service-card">
                  <Img src={s.image_url} alt={s.name} className="service-img" />
                  <div className="card-body">
                    <span className="chip">{s.category}</span>
                    <h3>{s.name}</h3>
                    {s.description && <p className="muted small">{s.description}</p>}
                    <div className="service-foot">
                      <span className="price">{formatPrice(s.price, settings.currency)}</span>
                      <span className="muted small"><Icon name="clock" size={14} /> {formatDuration(s.duration)}</span>
                    </div>
                    <Link to={`/reserver?service=${s.id}`} className="btn btn-ghost btn-sm btn-block">Réserver</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Réalisations</span>
                <h2>Nos derniers modèles</h2>
              </div>
              <Link to="/galerie" className="link-arrow">Toute la galerie <Icon name="arrow" size={16} /></Link>
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

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Communauté</span>
              <h2>Le fil {settings.name}</h2>
            </div>
            <Link to="/communaute" className="link-arrow">Voir le fil <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid grid-3">
            {(posts.data ?? []).slice(0, 3).map((p) => (
              <Link to="/communaute" key={p.id} className="card mini-post">
                {p.image_url && <Img src={p.image_url} alt="" className="mini-post-img" />}
                <div className="card-body">
                  <div className="post-author">
                    <Avatar name={p.author.full_name} url={p.author.avatar_url} size={32} />
                    <strong>{p.author.full_name}</strong>
                    {p.author.role === 'admin' && <span className="badge-salon">Salon</span>}
                  </div>
                  <p className="clamp-3">{p.content}</p>
                  <span className="muted small"><Icon name="heart" size={14} /> {p.like_count} · <Icon name="comment" size={14} /> {p.comments.length}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about">
          <div>
            <span className="eyebrow">Le salon</span>
            <h2>Bienvenue chez {settings.name}</h2>
            <p className="lead">{settings.about}</p>
            <div className="about-actions">
              <a className="btn btn-gold" href={mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" /> Itinéraire
              </a>
              <a className="btn btn-outline" href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                <Icon name="phone" /> Appeler
              </a>
            </div>
          </div>
          <div className="card hours-card">
            <h3><Icon name="clock" /> Horaires</h3>
            <ul className="hours">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className={d === now.getDay() ? 'today' : ''}>
                  <span>{DAY_NAMES[d]}</span>
                  <span>{settings.hours[d].closed ? 'Fermé' : `${settings.hours[d].open} – ${settings.hours[d].close}`}</span>
                </li>
              ))}
            </ul>
            <Link to="/reserver" className="btn btn-gold btn-block">Réserver un créneau</Link>
          </div>
        </div>
      </section>
    </>
  )
}
