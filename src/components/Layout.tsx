import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { DAY_NAMES, whatsappLink } from '../lib/utils'
import { Icon } from './Icon'
import { Avatar } from './ui'

const LINKS = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/prestations', label: 'Tarifs', icon: 'tag' },
  { to: '/galerie', label: 'Coiffures', icon: 'image' },
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
          Mode démo : les données restent dans ce navigateur. Configurez Supabase pour les partager (voir README).
        </div>
      )}
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark"><Icon name="scissors" size={18} /></span>
            <span>{settings.name}</span>
          </Link>
          <nav className={`nav-links ${open ? 'open' : ''}`}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
                {l.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="nav-link nav-admin">
                Administration
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
          <button className="icon-btn nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
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
            <div className="brand"><span className="brand-mark"><Icon name="scissors" size={18} /></span><span>{settings.name}</span></div>
            <p className="muted">{settings.tagline}</p>
            <div className="socials">
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer">Facebook</a>}
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
                <a href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name} !`)} target="_blank" rel="noreferrer">WhatsApp</a>
              </p>
            )}
          </div>
          <div>
            <h4>Horaires</h4>
            <ul className="hours">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d}>
                  <span>{DAY_NAMES[d]}</span>
                  <span>{settings.hours[d].closed ? 'Fermé' : `${settings.hours[d].open} – ${settings.hours[d].close}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="container footer-bottom muted">© {new Date().getFullYear()} {settings.name}</div>
      </footer>

      <nav className="tabbar">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="tab">
            <Icon name={l.icon} size={20} />
            <span>{l.label}</span>
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
