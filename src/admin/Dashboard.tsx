import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { STATUS_LABELS, bookingRef, formatDate, formatDuration, formatPrice, parseISODate, toISODate } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, Spinner } from '../components/ui'
import { ApptActions } from './apptActions'

export default function Dashboard() {
  const { settings } = useApp()
  const { data, loading, reload } = useLoad(() => api.listAppointments())
  const posts = useLoad(() => api.listPosts())
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')

  if (loading) return <Spinner />
  const all = data ?? []
  const today = toISODate(new Date())
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // lundi
  const weekStartISO = toISODate(weekStart)
  const monthPrefix = today.slice(0, 7)

  const live = all.filter((a) => a.status !== 'cancelled')
  const todays = live.filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time))
  const pending = all.filter((a) => a.status === 'pending' && a.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const earned = (list: typeof all) => list.filter((a) => a.status === 'done' || a.status === 'confirmed').reduce((s, a) => s + a.price, 0)
  const week = live.filter((a) => a.date >= weekStartISO && a.date <= today)
  const month = live.filter((a) => a.date.startsWith(monthPrefix))

  const counts = new Map<string, number>()
  month.forEach((a) => counts.set(a.service_name, (counts.get(a.service_name) ?? 0) + 1))
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topMax = top[0]?.[1] ?? 1

  // 7 prochains jours : nombre de rendez-vous
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = toISODate(d)
    return { iso, n: live.filter((a) => a.date === iso).length }
  })
  const max7 = Math.max(1, ...next7.map((d) => d.n))

  function findCode(e: React.FormEvent) {
    e.preventDefault()
    const wanted = code.trim().toUpperCase().replace(/^MC-?/, '')
    const hit = all.find((a) => bookingRef(a.id).replace('MC-', '') === wanted)
    if (hit) navigate(`/valider/${hit.id}`)
    else setCodeErr('Aucun rendez-vous avec ce code.')
  }

  return (
    <div className="dash">
      <form className="card code-box" onSubmit={findCode}>
        <label htmlFor="code"><Icon name="check" size={18} /> Valider par code</label>
        <input id="code" value={code} onChange={(e) => { setCode(e.target.value); setCodeErr('') }} placeholder="MC-XXXXXX" autoCapitalize="characters" />
        <button className="btn btn-gold btn-sm" disabled={!code.trim()}>Ouvrir</button>
        {codeErr && <span className="error-text">{codeErr}</span>}
      </form>
      <div className="stats">
        <div className="stat">
          <span className="stat-label"><Icon name="calendar" size={16} /> Aujourd’hui</span>
          <strong>{todays.length}</strong>
          <span className="muted small">rendez-vous</span>
        </div>
        <div className="stat stat-accent">
          <span className="stat-label"><Icon name="clock" size={16} /> À confirmer</span>
          <strong>{pending.length}</strong>
          <span className="muted small">demandes en attente</span>
        </div>
        <div className="stat">
          <span className="stat-label"><Icon name="chart" size={16} /> Cette semaine</span>
          <strong>{formatPrice(earned(week), settings.currency)}</strong>
          <span className="muted small">{week.length} rendez-vous</span>
        </div>
        <div className="stat">
          <span className="stat-label"><Icon name="star" size={16} /> Ce mois</span>
          <strong>{formatPrice(earned(month), settings.currency)}</strong>
          <span className="muted small">{month.length} rendez-vous · {posts.data?.length ?? 0} publications</span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="card card-pad">
          <div className="row-between">
            <h2>Planning du jour</h2>
            <Link to="/admin/rendez-vous" className="link-arrow">Tout voir <Icon name="arrow" size={16} /></Link>
          </div>
          {todays.length === 0 ? (
            <Empty icon="calendar" title="Aucun rendez-vous aujourd’hui" />
          ) : (
            <div className="timeline">
              {todays.map((a) => (
                <div key={a.id} className="timeline-row">
                  <span className="timeline-time">{a.time}</span>
                  <div className="timeline-body">
                    <strong>{a.client_name}</strong>
                    <span className="muted small">{a.service_name} · {formatDuration(a.duration)}</span>
                    {a.note && <span className="note">{a.note}</span>}
                    <span className={`status status-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                  </div>
                  <ApptActions a={a} onChange={reload} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <h2>Demandes à confirmer</h2>
          {pending.length === 0 ? (
            <Empty icon="check" title="Tout est à jour" />
          ) : (
            pending.slice(0, 8).map((a) => (
              <div key={a.id} className="pending-row">
                <div>
                  <strong>{a.client_name}</strong>
                  <span className="muted small">{a.service_name}</span>
                  <span className="small">{formatDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {a.time}</span>
                </div>
                <ApptActions a={a} onChange={reload} />
              </div>
            ))
          )}
        </section>

        <section className="card card-pad">
          <h2>7 prochains jours</h2>
          <div className="bars">
            {next7.map((d) => (
              <div key={d.iso} className="bar-col">
                <span className="bar-val">{d.n}</span>
                <div className="bar" style={{ height: `${(d.n / max7) * 100}%` }} />
                <span className="bar-label">{parseISODate(d.iso).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-pad">
          <h2>Prestations du mois</h2>
          {top.length === 0 ? (
            <p className="muted">Pas encore de données ce mois-ci.</p>
          ) : (
            top.map(([name, n]) => (
              <div key={name} className="hbar">
                <div className="row-between small"><span>{name}</span><strong>{n}</strong></div>
                <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(n / topMax) * 100}%` }} /></div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
