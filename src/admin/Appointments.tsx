import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { STATUS_LABELS, errorMessage, formatDate, formatDuration, formatPrice, toISODate } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, Modal, Spinner } from '../components/ui'
import type { AppointmentStatus } from '../types'
import { ApptActions } from './apptActions'

type Range = 'today' | 'upcoming' | 'past' | 'all'

export default function Appointments() {
  const { settings, toast } = useApp()
  const { data, loading, reload } = useLoad(() => api.listAppointments())
  const services = useLoad(() => api.listServices())
  const [range, setRange] = useState<Range>('upcoming')
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)

  const today = toISODate(new Date())
  const filtered = useMemo(() => {
    let list = data ?? []
    if (range === 'today') list = list.filter((a) => a.date === today)
    if (range === 'upcoming') list = list.filter((a) => a.date >= today)
    if (range === 'past') list = list.filter((a) => a.date < today)
    if (status !== 'all') list = list.filter((a) => a.status === status)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((a) => `${a.client_name} ${a.client_phone} ${a.service_name}`.toLowerCase().includes(s))
    }
    const asc = range !== 'past' && range !== 'all'
    return [...list].sort((a, b) => {
      const c = (a.date + a.time).localeCompare(b.date + b.time)
      return asc ? c : -c
    })
  }, [data, range, status, q, today])

  const byDay = filtered.reduce<Record<string, typeof filtered>>((acc, a) => {
    ;(acc[a.date] ??= []).push(a)
    return acc
  }, {})

  return (
    <div>
      <div className="toolbar">
        <div className="seg">
          {([['today', 'Aujourd’hui'], ['upcoming', 'À venir'], ['past', 'Passés'], ['all', 'Tous']] as const).map(([k, l]) => (
            <button key={k} className={range === k ? 'active' : ''} onClick={() => setRange(k)}>{l}</button>
          ))}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus | 'all')}>
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input className="search" placeholder="Rechercher un client, un téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-gold btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Ajouter</button>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty icon="calendar" title="Aucun rendez-vous" />
      ) : (
        Object.entries(byDay).map(([day, list]) => (
          <section key={day} className="day-group">
            <h3 className="day-title">
              {day === today ? 'Aujourd’hui — ' : ''}{formatDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="muted small"> · {list.filter((a) => a.status !== 'cancelled').length} rdv</span>
            </h3>
            {list.map((a) => (
              <div key={a.id} className={`card appt-row ${a.status === 'cancelled' ? 'faded' : ''}`}>
                <div className="appt-time">{a.time}</div>
                <div className="appt-info">
                  <strong>{a.client_name}</strong>
                  <span className="muted small">{a.client_phone}</span>
                  <span className="small">{a.service_name} · {formatDuration(a.duration)} · {formatPrice(a.price, settings.currency)}</span>
                  {a.note && <span className="note">{a.note}</span>}
                </div>
                <span className={`status status-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                <ApptActions a={a} onChange={reload} />
              </div>
            ))}
          </section>
        ))
      )}

      {adding && (
        <AddAppointment
          services={(services.data ?? []).filter((s) => s.active)}
          onClose={() => setAdding(false)}
          onSaved={async (input) => {
            try {
              const appt = await api.createAppointment(input)
              await api.updateAppointmentStatus(appt.id, 'confirmed')
              toast('Rendez-vous ajouté')
              setAdding(false)
              reload()
            } catch (e) {
              toast(errorMessage(e), 'error')
            }
          }}
        />
      )}
    </div>
  )
}

function AddAppointment({
  services,
  onClose,
  onSaved,
}: {
  services: { id: string; name: string; price: number; duration: number }[]
  onClose: () => void
  onSaved: (input: Parameters<typeof api.createAppointment>[0]) => void
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [date, setDate] = useState(toISODate(new Date()))
  const [time, setTime] = useState('10:00')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const svc = services.find((s) => s.id === serviceId)

  return (
    <Modal title="Ajouter un rendez-vous" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!svc) return
          onSaved({ service_id: svc.id, service_name: svc.name, price: svc.price, duration: svc.duration, client_name: name.trim(), client_phone: phone.trim(), date, time, note: note.trim() })
        }}
      >
        <p className="muted small">Pour un client venu sur place ou ayant appelé. Le rendez-vous est directement confirmé.</p>
        <label className="field">
          <span className="label">Prestation</span>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <div className="form-grid">
          <label className="field"><span className="label">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label className="field"><span className="label">Heure</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></label>
          <label className="field"><span className="label">Nom du client</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="field"><span className="label">Téléphone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
        </div>
        <label className="field"><span className="label">Note</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <button className="btn btn-gold btn-block">Enregistrer</button>
      </form>
    </Modal>
  )
}
