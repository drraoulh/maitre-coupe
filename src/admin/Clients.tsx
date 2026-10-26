import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { downloadCSV, formatDate, formatPrice, phoneKey, toISODate, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Avatar, Empty, Spinner } from '../components/ui'

interface ClientRow {
  key: string
  name: string
  phone: string
  visits: number // rendez-vous terminés
  bookings: number // tous sauf annulés
  spent: number
  last: string // dernière visite (date)
  next: string // prochain rendez-vous (date)
  favorite: string
}

type Sort = 'recent' | 'visits' | 'spent' | 'name'

/** Fichier clients construit à partir des rendez-vous (regroupés par numéro de téléphone). */
export default function Clients() {
  const { settings } = useApp()
  const { data, loading } = useLoad(() => api.listAppointments())
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const today = toISODate(new Date())

  const clients = useMemo(() => {
    const map = new Map<string, ClientRow & { services: Map<string, number> }>()
    for (const a of data ?? []) {
      const key = phoneKey(a.client_phone) || a.client_name.toLowerCase()
      const c = map.get(key) ?? { key, name: a.client_name, phone: a.client_phone, visits: 0, bookings: 0, spent: 0, last: '', next: '', favorite: '', services: new Map() }
      if (a.status !== 'cancelled') {
        c.bookings++
        c.services.set(a.service_name, (c.services.get(a.service_name) ?? 0) + 1)
      }
      if (a.status === 'done') {
        c.visits++
        c.spent += a.price
      }
      if (a.status !== 'cancelled' && a.date <= today && a.date > c.last) {
        c.last = a.date
        c.name = a.client_name // nom le plus récent
      }
      if (a.status !== 'cancelled' && a.date >= today && (!c.next || a.date < c.next)) c.next = a.date
      map.set(key, c)
    }
    return [...map.values()].map((c) => ({ ...c, favorite: [...c.services.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? '' }))
  }, [data, today])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = s ? clients.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(s)) : clients
    return [...list].sort((a, b) =>
      sort === 'visits' ? b.bookings - a.bookings : sort === 'spent' ? b.spent - a.spent : sort === 'name' ? a.name.localeCompare(b.name) : (b.next || b.last).localeCompare(a.next || a.last),
    )
  }, [clients, q, sort])

  const loyal = clients.filter((c) => c.bookings >= 3).length

  function exportCSV() {
    downloadCSV(`clients-${today}.csv`, [
      ['Nom', 'Téléphone', 'Rendez-vous', 'Visites terminées', `Total dépensé (${settings.currency})`, 'Dernière visite', 'Prochain RDV', 'Soin préféré'],
      ...shown.map((c) => [c.name, c.phone, c.bookings, c.visits, c.spent, c.last, c.next, c.favorite]),
    ])
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="stats stats-3">
        <div className="stat"><span className="stat-label"><Icon name="users" size={16} /> Clients</span><strong>{clients.length}</strong></div>
        <div className="stat"><span className="stat-label"><Icon name="star" size={16} /> Fidèles</span><strong>{loyal}</strong><span className="muted small">3 rendez-vous ou plus</span></div>
        <div className="stat"><span className="stat-label"><Icon name="calendar" size={16} /> À venir</span><strong>{clients.filter((c) => c.next).length}</strong><span className="muted small">avec un rendez-vous prévu</span></div>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Rechercher un nom ou un numéro…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="recent">Plus récents</option>
          <option value="visits">Plus de rendez-vous</option>
          <option value="spent">Plus gros total</option>
          <option value="name">Nom (A → Z)</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV} disabled={!shown.length}><Icon name="download" size={16} /> Export</button>
      </div>

      {shown.length === 0 ? (
        <Empty icon="users" title="Aucun client pour l’instant">
          <p className="muted small">Les clients apparaissent ici automatiquement à chaque réservation.</p>
        </Empty>
      ) : (
        <div className="admin-list">
          {shown.map((c) => {
            const tel = c.phone.replace(/[^\d+]/g, '')
            return (
              <div key={c.key} className="card client-row">
                <Avatar name={c.name} url={null} size={42} />
                <div className="client-info">
                  <strong>
                    {c.name} {c.bookings >= 3 && <span className="badge-loyal">Fidèle</span>}
                  </strong>
                  <span className="muted small">{c.phone}</span>
                  <span className="small">
                    {c.bookings} rdv · {c.visits} visite{c.visits > 1 ? 's' : ''} · {formatPrice(c.spent, settings.currency)}
                    {c.favorite && <> · <em>{c.favorite}</em></>}
                  </span>
                  <span className="muted tiny">
                    {c.last && <>Dernière visite : {formatDate(c.last, { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                    {c.next && <> · Prochain : <Link to={`/admin/rendez-vous?vue=day&jour=${c.next}`}>{formatDate(c.next, { day: 'numeric', month: 'short' })}</Link></>}
                  </span>
                </div>
                <div className="appt-actions">
                  <a className="icon-btn" href={whatsappLink(tel, `Bonjour ${c.name}, ici ${settings.name} ! `)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={18} /></a>
                  <a className="icon-btn" href={`tel:${tel}`} aria-label="Appeler"><Icon name="phone" size={18} /></a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
