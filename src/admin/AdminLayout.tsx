import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { Icon } from '../components/Icon'
import { Avatar, Brand } from '../components/ui'

const LINKS = [
  { to: '/admin', label: 'Tableau de bord', icon: 'chart', end: true },
  { to: '/admin/rendez-vous', label: 'Rendez-vous', icon: 'calendar' },
  { to: '/admin/prestations', label: 'Soins & prix', icon: 'tag' },
  { to: '/admin/coiffures', label: 'Modèles (galerie)', icon: 'image' },
  { to: '/admin/publications', label: 'Communauté', icon: 'users' },
  { to: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
]

export default function AdminLayout() {
  const { user, refreshUser } = useApp()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])

  return (
    <div className="admin">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <Link to="/"><Brand /></Link>
        <span className="admin-label">Administration</span>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="admin-link">
              <Icon name={l.icon} size={18} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/" className="admin-link"><Icon name="home" size={18} /> Voir le site</Link>
          <button className="admin-link" onClick={() => api.signOut().then(refreshUser)}>
            <Icon name="logout" size={18} /> Déconnexion
          </button>
          <div className="admin-me">
            <Avatar name={user!.full_name || user!.email} url={user!.avatar_url} size={32} />
            <div>
              <strong>{user!.full_name || 'Admin'}</strong>
              <span className="muted tiny">{user!.email}</span>
            </div>
          </div>
        </div>
      </aside>
      {open && <div className="admin-scrim" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <header className="admin-top">
          <button className="icon-btn admin-burger" onClick={() => setOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <span className="admin-top-title">{LINKS.find((l) => (l.end ? loc.pathname === l.to : loc.pathname.startsWith(l.to)))?.label}</span>
          {api.mode === 'demo' && <span className="pill pill-demo">Mode démo</span>}
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
