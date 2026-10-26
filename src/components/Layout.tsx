import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { DAY_NAMES, whatsappLink } from '../lib/utils'
import { Icon } from './Icon'
import { Avatar, Brand } from './ui'

const LINKS = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/prestations', label: 'Soins & tarifs', short: 'Tarifs', icon: 'tag' },
  { to: '/galerie', label: 'Galerie', icon: 'image' },
  { to: '/communaute', label: 'Communauté', icon: 'users' },
]

export function Layout() {
  const { user, settings } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      {api.mode === 'demo' && (
        <div className="demo-banner">
          Mode démo : les données restent dans ce navigateur.
        </div>
      )}
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" aria-label={`${settings.name} — accueil`}>
            <Brand />
          </Link>
          <nav className={`nav-links ${open ? 'open' : ''}`}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
                {l.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="nav-link nav-admin">
                <Icon name="settings" size={16} /> Administration
              </NavLink>
            )}
            {user ? (
              <NavLink to="/mon-espace" className="nav-link nav-user">
                <Avatar name={user.full_name || user.email} url={user.avatar_url} size={28} />
                <span>Mon espace</span>
              </NavLink>
            ) : (
              <NavLink to="/connexion" className="nav-link">
                Connexion
              </NavLink>
            )}
            <Link to="/reserver" className="btn btn-gold btn-sm nav-cta">
              Réserver
            </Link>
          </nav>
          <button className="icon-btn nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Brand />
            <p className="muted footer-about">{settings.about}</p>
            <div className="socials">
              {settings.google_url && (
                <a href={settings.google_url} target="_blank" rel="noreferrer" aria-label="Google"><Icon name="google" size={18} /></a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook" size={18} /></a>
              )}
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noreferrer">TikTok</a>}
            </div>
          </div>
          <div>
            <h4>Contact</h4>
            <p className="footer-line"><Icon name="pin" size={16} /> {settings.address}, {settings.city}</p>
            <p className="footer-line"><Icon name="phone" size={16} /> <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></p>
            {settings.whatsapp && (
              <p className="footer-line">
                <Icon name="whatsapp" size={16} />{' '}
                <a href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name} !`)} target="_blank" rel="noreferrer">Écrire sur WhatsApp</a>
              </p>
            )}
            {settings.google_rating > 0 && (
              <p className="footer-line">
                <Icon name="star" size={16} />{' '}
                <a href={settings.google_url || '#'} target="_blank" rel="noreferrer">
                  {settings.google_rating.toLocaleString('fr-FR')}/5 · {settings.google_reviews} avis Google
                </a>
              </p>
            )}
          </div>
          <div>
            <h4>Horaires</h4>
            <ul className="hours">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className={d === new Date().getDay() ? 'today' : ''}>
                  <span>{DAY_NAMES[d]}</span>
                  <span>{settings.hours[d].closed ? 'Fermé' : `${settings.hours[d].open} – ${settings.hours[d].close}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="container footer-bottom muted">© {new Date().getFullYear()} {settings.name} · {settings.city}</div>
      </footer>

      <nav className="tabbar" aria-label="Navigation principale">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="tab">
            <Icon name={l.icon} size={20} />
            <span>{l.short ?? l.label}</span>
          </NavLink>
        ))}
        <NavLink to="/reserver" className="tab tab-cta">
          <Icon name="calendar" size={20} />
          <span>Réserver</span>
        </NavLink>
      </nav>
    </>
  )
}
