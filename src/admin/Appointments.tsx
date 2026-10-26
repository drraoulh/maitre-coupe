import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import {
  STATUS_LABELS, addDays, bookingRef, downloadCSV, errorMessage, formatDate, formatDuration, formatPrice,
  normalizeCameroonPhone, toISODate,
} from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, Modal, Spinner } from '../components/ui'
import type { Appointment, AppointmentStatus, Service } from '../types'
import { ApptActions } from './apptActions'

type Range = 'day' | 'upcoming' | 'past' | 'all'

export default function Appointments() {
  const { settings, toast } = useApp()
  const { data, loading, reload } = useLoad(() => api.listAppointments())
  const services = useLoad(() => api.listServices())
  const [params, setParams] = useSearchParams()
  const today = toISODate(new Date())
  const range = (params.get('vue') as Range) || 'day'
  const day = params.get('jour') || today
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Appointment | 'new' | null>(null)

  const go = (next: { vue?: Range; jour?: string }) => {
    const vue = next.vue ?? range
    setParams(vue === 'day' ? { vue, jour: next.jour || day } : { vue }, { replace: true })
  }

  const filtered = useMemo(() => {
    let list = data ?? []
    if (range === 'day') list = list.filter((a) => a.date === day)
    if (range === 'upcoming') list = list.filter((a) => a.date >= today)
    if (range === 'past') list = list.filter((a) => a.date < today)
    if (status !== 'all') list = list.filter((a) => a.status === status)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((a) => `${a.client_name} ${a.client_phone} ${a.service_name} ${bookingRef(a.id)}`.toLowerCase().includes(s))
    }
    const asc = range === 'day' || range === 'upcoming'
    return [...list].sort((a, b) => {
      const c = (a.date + a.time).localeCompare(b.date + b.time)
      return asc ? c : -c
    })
  }, [data, range, day, status, q, today])

  const byDay = filtered.reduce<Record<string, Appointment[]>>((acc, a) => {
    ;(acc[a.date] ??= []).push(a)
    return acc
  }, {})

  const dayLive = filtered.filter((a) => a.status !== 'cancelled')
  const dayTotal = dayLive.reduce((s, a) => s + a.price, 0)

  function exportCSV() {
    downloadCSV(`rendez-vous-${range === 'day' ? day : today}.csv`, [
      ['Code', 'Date', 'Heure', 'Client', 'Téléphone', 'Soin', 'Durée (min)', `Prix (${settings.currency})`, 'Statut', 'Note'],
      ...filtered.map((a) => [bookingRef(a.id), a.date, a.time, a.client_name, a.client_phone, a.service_name, a.duration, a.price, STATUS_LABELS[a.status], a.note]),
    ])
  }

  return (
    <div>
      <div className="toolbar">
        <div className="seg">
          {([['day', 'Jour'], ['upcoming', 'À venir'], ['past', 'Passés'], ['all', 'Tous']] as const).map(([k, l]) => (
            <button key={k} className={range === k ? 'active' : ''} onClick={() => go({ vue: k })}>{l}</button>
          ))}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus | 'all')}>
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input className="search" placeholder="Client, téléphone ou code MC-…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="toolbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={exportCSV} disabled={!filtered.length} title="Télécharger pour Excel">
            <Icon name="download" size={16} /> Export
          </button>
          <button className="btn btn-gold btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Ajouter</button>
        </div>
      </div>

      {range === 'day' && (
        <div className="day-nav card">
          <button className="icon-btn" onClick={() => go({ jour: addDays(day, -1) })} aria-label="Jour précédent"><Icon name="chevron-left" /></button>
          <div className="day-nav-center">
            <strong className="day-nav-title">{day === today ? 'Aujourd’hui' : day === addDays(today, 1) ? 'Demain' : formatDate(day, { weekday: 'long' })}</strong>
            <label className="day-nav-date">
              {formatDate(day, { day: 'numeric', month: 'long', year: 'numeric' })}
              <input type="date" value={day} onChange={(e) => e.target.value && go({ jour: e.target.value })} aria-label="Choisir une date" />
            </label>
            <span className="muted small">
              {dayLive.length} rdv · {formatPrice(dayTotal, settings.currency)} prévus
              {settings.hours[new Date(day + 'T12:00').getDay()].closed && ' · salon fermé'}
            </span>
          </div>
          <button className="icon-btn" onClick={() => go({ jour: addDays(day, 1) })} aria-label="Jour suivant"><Icon name="chevron-right" /></button>
          {day !== today && <button className="btn btn-ghost btn-sm day-nav-today" onClick={() => go({ jour: today })}>Aujourd’hui</button>}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty icon="calendar" title={range === 'day' ? 'Aucun rendez-vous ce jour-là' : 'Aucun rendez-vous'} />
      ) : (
        Object.entries(byDay).map(([d, list]) => (
          <section key={d} className="day-group">
            {range !== 'day' && (
              <h3 className="day-title">
                {d === today ? 'Aujourd’hui — ' : ''}{formatDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="muted small"> · {list.filter((a) => a.status !== 'cancelled').length} rdv</span>
              </h3>
            )}
            {list.map((a) => (
              <div key={a.id} className={`card appt-row ${a.status === 'cancelled' ? 'faded' : ''}`}>
                <div className="appt-time">{a.time}</div>
                <div className="appt-info">
                  <strong>{a.client_name} <span className="ref-sm">{bookingRef(a.id)}</span></strong>
                  <span className="muted small">{a.client_phone}</span>
                  <span className="small">{a.service_name} · {formatDuration(a.duration)} · {a.price > 0 ? formatPrice(a.price, settings.currency) : 'Sur devis'}</span>
                  {a.note && <span className="note">{a.note}</span>}
                </div>
                <span className={`status status-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                <div className="appt-actions">
                  <ApptActions a={a} onChange={reload} />
                  <button className="icon-btn" onClick={() => setEditing(a)} title="Modifier / déplacer" aria-label="Modifier"><Icon name="edit" size={18} /></button>
                </div>
              </div>
            ))}
          </section>
        ))
      )}

      {editing && (
        <ApptForm
          initial={editing === 'new' ? null : editing}
          defaultDate={range === 'day' ? day : today}
          services={(services.data ?? []).filter((s) => s.active || (editing !== 'new' && s.id === editing.service_id))}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
            window.dispatchEvent(new Event('mc:rdv-change'))
          }}
          toast={toast}
        />
      )}
    </div>
  )
}

/** Ajout (client venu sur place / par téléphone) ou modification d'un rendez-vous. */
function ApptForm({
  initial,
  defaultDate,
  services,
  onClose,
  onSaved,
  toast,
}: {
  initial: Appointment | null
  defaultDate: string
  services: Service[]
  onClose: () => void
  onSaved: () => void
  toast: (m: string, k?: 'success' | 'error') => void
}) {
  const [serviceId, setServiceId] = useState(initial?.service_id ?? services[0]?.id ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const [time, setTime] = useState(initial?.time ?? '10:00')
  const [name, setName] = useState(initial?.client_name ?? '')
  const [phone, setPhone] = useState(initial?.client_phone ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [busy, setBusy] = useState(false)
  const svc = services.find((s) => s.id === serviceId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const tel = normalizeCameroonPhone(phone) ?? phone.trim()
    setBusy(true)
    try {
      const fields = {
        service_id: svc?.id ?? initial?.service_id ?? null,
        service_name: svc?.name ?? initial?.service_name ?? 'Prestation',
        price: svc?.price ?? initial?.price ?? 0,
        duration: svc?.duration ?? initial?.duration ?? 30,
        client_name: name.trim(),
        client_phone: tel,
        date,
        time,
        note: note.trim(),
      }
      if (initial) {
        await api.updateAppointment(initial.id, fields)
        toast(initial.date !== date || initial.time !== time ? 'Rendez-vous déplacé' : 'Rendez-vous modifié')
      } else {
        const appt = await api.createAppointment({ ...fields, service_id: fields.service_id ?? '' })
        await api.updateAppointmentStatus(appt.id, 'confirmed')
        toast('Rendez-vous ajouté')
      }
      onSaved()
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={initial ? `Modifier ${bookingRef(initial.id)}` : 'Ajouter un rendez-vous'} onClose={onClose}>
      <form onSubmit={submit}>
        {!initial && <p className="muted small">Pour un client venu sur place ou qui a appelé : le rendez-vous est directement confirmé.</p>}
        {initial && (initial.date !== date || initial.time !== time) && (
          <p className="note">Pensez à prévenir le client du changement (bouton WhatsApp sur le rendez-vous).</p>
        )}
        <label className="field">
          <span className="label">Soin</span>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required={!initial}>
            {initial && !services.some((s) => s.id === initial.service_id) && <option value={initial.service_id ?? ''}>{initial.service_name}</option>}
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatDuration(s.duration)}</option>)}
          </select>
        </label>
        <div className="form-grid">
          <label className="field"><span className="label">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label className="field"><span className="label">Heure</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} step={300} required /></label>
          <label className="field"><span className="label">Nom du client</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="field"><span className="label">Téléphone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
        </div>
        <label className="field"><span className="label">Note</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </Modal>
  )
}
