import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { EXTRAS, UNIVERS } from '../lib/univers'
import { DAY_NAMES, toMinutes, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Img } from '../components/ui'
import { PageHero } from '../components/PageHero'

export default function Salon() {
  const { settings } = useApp()
  const now = new Date()
  const today = settings.hours[now.getDay()]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isOpen = !today.closed && nowMin >= toMinutes(today.open) && nowMin < toMinutes(today.close)
  const place = `${settings.name}, ${settings.address}, ${settings.city}, Cameroun`
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(`Nkolmesseng ${settings.city} Cameroun`)}&z=15&output=embed`
  const photos = [
    { src: '/images/salon-interieur.webp', label: 'L’espace coiffure' },
    { src: settings.salon_photo, label: 'La cabine de soins' },
    { src: '/images/coupe-enfant.webp', label: 'Coiffure pour petits et grands' },
  ].filter((p) => p.src)

  return (
    <>
      <PageHero
        eyebrow="Le salon"
        title={`Bienvenue chez ${settings.name}`}
        text={<>{settings.tagline} · {settings.address}, {settings.city}</>}
      >
        <div className="hero-actions">
          <Link to="/reserver" className="btn btn-gold"><Icon name="calendar" /> Réserver</Link>
          <a className="btn btn-light" href={mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" /> Itinéraire</a>
        </div>
      </PageHero>

      <div className="container page">
        <section className="salon-intro">
          <div>
            <span className="eyebrow">Notre histoire</span>
            <h2>Un seul lieu pour la coiffure, la beauté et le bien-être</h2>
            <p className="lead">{settings.about}</p>
            <div className="chips-row">
              {UNIVERS.map((u) => (
                <Link key={u.name} to={`/prestations?univers=${encodeURIComponent(u.name)}`} className="chip-link">
                  <Icon name={u.icon} size={16} /> {u.name}
                </Link>
              ))}
              {EXTRAS.map((u) => (
                <Link key={u.name} to={`/prestations?univers=${encodeURIComponent(u.name)}`} className="chip-link chip-link-red">
                  <Icon name={u.icon} size={16} /> {u.name}
                </Link>
              ))}
            </div>
          </div>
          {settings.owner_photo && (
            <figure className="owner-card">
              <Img src={settings.owner_photo} alt={settings.owner_name || `Le gérant de ${settings.name}`} />
              <figcaption>
                <span className="eyebrow">Le gérant</span>
                <strong>{settings.owner_name || 'Votre Maître Coupe'}</strong>
                {settings.owner_bio && <span className="muted small">{settings.owner_bio}</span>}
              </figcaption>
            </figure>
          )}
        </section>

        <section className="section-tight">
          <div className="section-head">
            <div>
              <span className="eyebrow">En images</span>
              <h2>Nos espaces</h2>
            </div>
            <Link to="/galerie" className="link-arrow">Nos réalisations <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="salon-photos">
            {photos.map((p, i) => (
              <figure key={p.label} className={i === 0 ? 'wide' : ''}>
                <Img src={p.src} alt={p.label} />
                <figcaption>{p.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {settings.amenities.length > 0 && (
          <section className="section-tight">
            <span className="eyebrow">Les petits plus</span>
            <h2>Pourquoi nous choisir</h2>
            <ul className="amenities">
              {settings.amenities.map((a) => (
                <li key={a}><span className="amenity-check"><Icon name="check" size={16} /></span>{a}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="section-tight contact-grid">
          <div className="card card-pad contact-card">
            <span className="eyebrow">Nous trouver</span>
            <h2>Contact & accès</h2>
            <p className="contact-line"><Icon name="pin" /> <span><strong>{settings.address}</strong><br />{settings.city}, Cameroun</span></p>
            <p className="contact-line"><Icon name="phone" />
              <span>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
                {settings.phone2 && <><br /><a href={`tel:${settings.phone2.replace(/\s/g, '')}`}>{settings.phone2}</a></>}
              </span>
            </p>
            {settings.email && <p className="contact-line"><Icon name="mail" /> <a href={`mailto:${settings.email}`}>{settings.email}</a></p>}
            <div className="about-actions">
              {settings.whatsapp && (
                <a className="btn btn-whatsapp" href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name} !`)} target="_blank" rel="noreferrer"><Icon name="whatsapp" /> WhatsApp</a>
              )}
              <a className="btn btn-outline" href={mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" /> Itinéraire</a>
            </div>
            <h3 className="mt">
              Horaires <span className={`status ${isOpen ? 'status-confirmed' : 'status-cancelled'}`}>{isOpen ? 'Ouvert' : 'Fermé'}</span>
            </h3>
            <ul className="hours">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className={d === now.getDay() ? 'today' : ''}>
                  <span>{DAY_NAMES[d]}</span>
                  <span>{settings.hours[d].closed ? 'Fermé' : `${settings.hours[d].open} – ${settings.hours[d].close}`}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="map-wrap">
            <iframe title={`Plan d’accès ${settings.name}`} src={embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <p className="muted small map-note">Repère : {settings.address}.</p>
          </div>
        </section>

        {settings.google_rating > 0 && (
          <section className="review-band">
            <div>
              <span className="stars">★★★★★</span>
              <h2>{settings.google_rating.toLocaleString('fr-FR')}/5 sur Google</h2>
              <p className="muted">{settings.google_reviews} clients nous ont déjà laissé leur avis. Et vous ?</p>
            </div>
            <div className="about-actions">
              {settings.google_url && <a className="btn btn-gold" href={settings.google_url} target="_blank" rel="noreferrer"><Icon name="star" /> Voir et laisser un avis</a>}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
