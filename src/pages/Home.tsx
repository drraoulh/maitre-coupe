import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { DAY_NAMES, formatDuration, formatPrice, toISODate, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Avatar, Img } from '../components/ui'

export default function Home() {
  const { settings } = useApp()
  const services = useLoad(() => api.listServices())
  const styles = useLoad(() => api.listHairstyles())
  const posts = useLoad(() => api.listPosts())

  const today = settings.hours[new Date().getDay()]
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const [oh, om] = today.open.split(':').map(Number)
  const [ch, cm] = today.close.split(':').map(Number)
  const isOpen = !today.closed && nowMin >= oh * 60 + om && nowMin < ch * 60 + cm
  const featured = (services.data ?? []).filter((s) => s.active).slice(0, 6)
  const categories = new Set((services.data ?? []).map((s) => s.category)).size

  return (
    <>
      <section className="hero" style={{ backgroundImage: `url(${settings.hero_image})` }}>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className={`pill ${isOpen ? 'pill-open' : 'pill-closed'}`}>
            <span className="dot" /> {isOpen ? `Ouvert jusqu’à ${today.close}` : 'Fermé pour le moment'}
          </span>
          <h1>{settings.name}</h1>
          <p className="hero-tagline">{settings.tagline}</p>
          <div className="hero-actions">
            <Link to="/reserver" className="btn btn-gold btn-lg">
              <Icon name="calendar" /> Prendre rendez-vous
            </Link>
            <Link to="/prestations" className="btn btn-outline btn-lg">
              Voir les tarifs
            </Link>
          </div>
          <div className="hero-stats">
            <div><strong>{(services.data ?? []).filter((s) => s.active).length || '—'}</strong><span>prestations</span></div>
            <div><strong>{categories || '—'}</strong><span>univers</span></div>
            <div><strong>{(styles.data ?? []).length || '—'}</strong><span>réalisations</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos prestations</span>
              <h2>Coiffure & beauté pour tous</h2>
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
                  <p className="muted small">{s.description}</p>
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

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos réalisations</span>
              <h2>Les dernières coiffures</h2>
            </div>
            <Link to="/galerie" className="link-arrow">Toute la galerie <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="masonry">
            {(styles.data ?? []).slice(0, 6).map((h) => (
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

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Communauté</span>
              <h2>Ce que partagent nos clients</h2>
            </div>
            <Link to="/communaute" className="link-arrow">Rejoindre <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid grid-3">
            {(posts.data ?? []).slice(0, 3).map((p) => (
              <Link to="/communaute" key={p.id} className="card mini-post">
                {p.image_url && <Img src={p.image_url} alt="" className="mini-post-img" />}
                <div className="card-body">
                  <div className="post-author">
                    <Avatar name={p.author.full_name} url={p.author.avatar_url} size={32} />
                    <strong>{p.author.full_name}</strong>
                  </div>
                  <p className="clamp-3">{p.content}</p>
                  <span className="muted small"><Icon name="heart" size={14} /> {p.like_count} · <Icon name="comment" size={14} /> {p.comments.length}</span>
                </div>
              </Link>
            ))}
            {posts.data?.length === 0 && <p className="muted">Soyez le premier à publier dans la communauté !</p>}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container about">
          <div>
            <span className="eyebrow">Le salon</span>
            <h2>Bienvenue chez {settings.name}</h2>
            <p className="lead">{settings.about}</p>
            <div className="about-actions">
              <a className="btn btn-gold" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.address} ${settings.city}`)}`} target="_blank" rel="noreferrer">
                <Icon name="pin" /> Itinéraire
              </a>
              {settings.whatsapp && (
                <a className="btn btn-outline" href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name}, j'aimerais avoir des informations.`)} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" /> WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="card hours-card">
            <h3><Icon name="clock" /> Horaires</h3>
            <ul className="hours">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className={d === new Date().getDay() ? 'today' : ''}>
                  <span>{DAY_NAMES[d]}</span>
                  <span>{settings.hours[d].closed ? 'Fermé' : `${settings.hours[d].open} – ${settings.hours[d].close}`}</span>
                </li>
              ))}
            </ul>
            <Link to={`/reserver?date=${toISODate(new Date())}`} className="btn btn-gold btn-block">Réserver un créneau</Link>
          </div>
        </div>
      </section>
    </>
  )
}
