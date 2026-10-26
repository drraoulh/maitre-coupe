import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import {
  availableSlots, errorMessage, formatDate, formatDuration, formatPrice, hoursFor, toISODate, whatsappLink,
} from '../lib/utils'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/ui'
import type { Appointment, BusySlot } from '../types'

const DAYS_AHEAD = 30

export default function Booking() {
  const { settings, user, toast } = useApp()
  const [params] = useSearchParams()
  const services = useLoad(() => api.listServices())
  const active = (services.data ?? []).filter((s) => s.active)

  const [serviceId, setServiceId] = useState(params.get('service') ?? '')
  const [date, setDate] = useState(params.get('date') ?? '')
  const [time, setTime] = useState('')
  const [busy, setBusy] = useState<BusySlot[] | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState(params.get('style') ? `Modèle souhaité : ${params.get('style')}` : '')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<Appointment | null>(null)

  useEffect(() => {
    if (user) {
      setName((n) => n || user.full_name)
      setPhone((p) => p || user.phone)
    }
  }, [user])

  const service = active.find((s) => s.id === serviceId)

  const days = useMemo(() => {
    const list: string[] = []
    const d = new Date()
    for (let i = 0; i < DAYS_AHEAD; i++) {
      list.push(toISODate(d))
      d.setDate(d.getDate() + 1)
    }
    return list
  }, [])

  useEffect(() => {
    setTime('')
    if (!date) return
    setBusy(null)
    let cancelled = false
    api.getBusySlots(date).then((b) => !cancelled && setBusy(b)).catch(() => !cancelled && setBusy([]))
    return () => {
      cancelled = true
    }
  }, [date])

  const slots = service && date && busy ? availableSlots(settings, date, service.duration, busy) : []

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!service || !date || !time) return
    setSending(true)
    try {
      const appt = await api.createAppointment({
        service_id: service.id,
        service_name: service.name,
        price: service.price,
        duration: service.duration,
        client_name: name.trim(),
        client_phone: phone.trim(),
        date,
        time,
        note: note.trim(),
      })
      setDone(appt)
      window.scrollTo(0, 0)
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    const msg = `Bonjour ${settings.name}, je viens de réserver :\n• ${done.service_name}\n• ${formatDate(done.date)} à ${done.time}\n• Nom : ${done.client_name}\n• Tél : ${done.client_phone}${done.note ? `\n• Note : ${done.note}` : ''}`
    return (
      <div className="container page narrow">
        <div className="card success-card">
          <div className="success-icon"><Icon name="check" size={32} /></div>
          <h1>Demande envoyée !</h1>
          <p className="muted">Le salon va confirmer votre rendez-vous très vite.</p>
          <div className="summary">
            <div><span>Prestation</span><strong>{done.service_name}</strong></div>
            <div><span>Date</span><strong>{formatDate(done.date)}</strong></div>
            <div><span>Heure</span><strong>{done.time}</strong></div>
            <div><span>Prix</span><strong>{formatPrice(done.price, settings.currency)}</strong></div>
          </div>
          {settings.whatsapp && (
            <a className="btn btn-whatsapp btn-block" href={whatsappLink(settings.whatsapp, msg)} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> Prévenir le salon sur WhatsApp
            </a>
          )}
          {user ? (
            <Link to="/mon-espace" className="btn btn-ghost btn-block">Voir mes rendez-vous</Link>
          ) : (
            <p className="small muted">
              <Link to="/connexion">Créez un compte</Link> pour suivre vos rendez-vous et rejoindre la communauté.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container page narrow">
      <div className="page-head">
        <span className="eyebrow">Réservation</span>
        <h1>Prendre rendez-vous</h1>
        <p className="muted">Trois étapes, moins d’une minute.</p>
      </div>

      <form onSubmit={submit} className="booking">
        <section className="step">
          <h2><span className="step-num">1</span> Choisissez un soin</h2>
          {services.loading ? (
            <Spinner />
          ) : active.length === 0 ? (
            <div className="card card-pad">
              <p>La réservation en ligne ouvre très bientôt.</p>
              <p className="muted small">En attendant, réservez directement auprès du salon :</p>
              <div className="about-actions">
                {settings.whatsapp && (
                  <a className="btn btn-whatsapp" href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name}, je souhaite prendre rendez-vous.`)} target="_blank" rel="noreferrer">
                    <Icon name="whatsapp" /> WhatsApp
                  </a>
                )}
                <a className="btn btn-outline" href={`tel:${settings.phone.replace(/\s/g, '')}`}><Icon name="phone" /> {settings.phone}</a>
              </div>
            </div>
          ) : (
            <div className="choice-list">
              {active.map((s) => (
                <label key={s.id} className={`choice ${s.id === serviceId ? 'selected' : ''}`}>
                  <input type="radio" name="service" value={s.id} checked={s.id === serviceId} onChange={() => { setServiceId(s.id); setTime('') }} />
                  <div className="choice-main">
                    <strong>{s.name}</strong>
                    <span className="muted small">{s.category} · {formatDuration(s.duration)}</span>
                  </div>
                  <span className="price">{formatPrice(s.price, settings.currency)}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className={`step ${!service ? 'step-disabled' : ''}`}>
          <h2><span className="step-num">2</span> Date et heure</h2>
          <div className="date-strip">
            {days.map((d) => {
              const closed = hoursFor(settings, d).closed
              const dt = new Date(d + 'T12:00:00')
              return (
                <button
                  type="button"
                  key={d}
                  disabled={closed || !service}
                  className={`date-btn ${d === date ? 'selected' : ''}`}
                  onClick={() => setDate(d)}
                >
                  <span className="small">{dt.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                  <strong>{dt.getDate()}</strong>
                  <span className="small">{closed ? 'fermé' : dt.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                </button>
              )
            })}
          </div>
          {service && date && (
            busy === null ? (
              <Spinner />
            ) : slots.length === 0 ? (
              <p className="muted">Aucun créneau disponible ce jour-là. Essayez une autre date.</p>
            ) : (
              <div className="slots">
                {slots.map((t) => (
                  <button type="button" key={t} className={`slot ${t === time ? 'selected' : ''}`} onClick={() => setTime(t)}>
                    {t}
                  </button>
                ))}
              </div>
            )
          )}
        </section>

        <section className={`step ${!time ? 'step-disabled' : ''}`}>
          <h2><span className="step-num">3</span> Vos coordonnées</h2>
          <div className="form-grid">
            <label className="field">
              <span className="label">Nom complet</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Grâce Mballa" disabled={!time} />
            </label>
            <label className="field">
              <span className="label">Téléphone / WhatsApp</span>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XX XX XX" disabled={!time} />
            </label>
          </div>
          <label className="field">
            <span className="label">Précisions (facultatif)</span>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Modèle souhaité, longueur, préférence…" disabled={!time} />
          </label>
        </section>

        {service && date && time && (
          <div className="card recap">
            <div>
              <strong>{service.name}</strong>
              <span className="muted small">{formatDate(date)} à {time} · {formatDuration(service.duration)}</span>
            </div>
            <span className="price">{formatPrice(service.price, settings.currency)}</span>
          </div>
        )}

        <button className="btn btn-gold btn-lg btn-block" disabled={!service || !date || !time || sending}>
          {sending ? 'Envoi…' : 'Confirmer la réservation'}
        </button>
      </form>
    </div>
  )
}
