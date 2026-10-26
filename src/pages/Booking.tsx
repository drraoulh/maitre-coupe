import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { EXTRAS, UNIVERS, sortCategories } from '../lib/univers'
import {
  availableSlots, bookingRef, calendarFile, dayPart, errorMessage, formatDate, formatDuration, formatPrice, hoursFor,
  normalizeCameroonPhone, toISODate, whatsappLink,
} from '../lib/utils'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/ui'
import { PageHero } from '../components/PageHero'
import type { Appointment, BusySlot } from '../types'

const DAYS_AHEAD = 30
const REMEMBER_KEY = 'mc_client'
const PARTS = ['Matin', 'Après-midi', 'Soir'] as const
const iconFor = (cat: string) => [...UNIVERS, ...EXTRAS].find((u) => u.name === cat)?.icon ?? (cat === 'Formules' ? 'star' : 'scissors')

/** Coordonnées mémorisées sur ce téléphone pour la prochaine réservation (confort uniquement). */
function remembered(): { name: string; phone: string } {
  try {
    return JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? '') as { name: string; phone: string }
  } catch {
    return { name: '', phone: '' }
  }
}

export default function Booking() {
  const { settings, user, toast } = useApp()
  const [params] = useSearchParams()
  const services = useLoad(() => api.listServices())
  const active = useMemo(() => (services.data ?? []).filter((s) => s.active), [services.data])

  const [serviceId, setServiceId] = useState(params.get('service') ?? '')
  const [date, setDate] = useState(params.get('date') ?? '')
  const [time, setTime] = useState('')
  const [busy, setBusy] = useState<BusySlot[] | null>(null)
  const [name, setName] = useState(() => remembered().name)
  const [phone, setPhone] = useState(() => remembered().phone)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [atHome, setAtHome] = useState(false)
  const [address, setAddress] = useState('')
  const [note, setNote] = useState(params.get('style') ? `Modèle souhaité : ${params.get('style')}` : '')
  const [remember, setRemember] = useState(true)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<Appointment | null>(null)
  const step2 = useRef<HTMLElement>(null)
  const step3 = useRef<HTMLElement>(null)

  useEffect(() => {
    if (user) {
      setName((n) => n || user.full_name)
      setPhone((p) => p || user.phone)
    }
  }, [user])

  const service = active.find((s) => s.id === serviceId)
  const grouped = useMemo(
    () => sortCategories(active.map((s) => s.category)).map((c) => [c, active.filter((s) => s.category === c)] as const),
    [active],
  )

  const days = useMemo(() => {
    const list: string[] = []
    const d = new Date()
    for (let i = 0; i < DAYS_AHEAD; i++) {
      list.push(toISODate(d))
      d.setDate(d.getDate() + 1)
    }
    return list
  }, [])

  // Premier jour ouvert proposé automatiquement dès qu'un soin est choisi.
  useEffect(() => {
    if (service && !date) setDate(days.find((d) => !hoursFor(settings, d).closed) ?? '')
  }, [service, date, days, settings])

  function loadBusy(d: string) {
    setBusy(null)
    return api.getBusySlots(d).then(setBusy).catch(() => setBusy([]))
  }

  useEffect(() => {
    setTime('')
    if (date) loadBusy(date)
  }, [date])

  const slots = service && date && busy ? availableSlots(settings, date, service.duration, busy) : []
  const phoneOk = normalizeCameroonPhone(phone)
  const isHomeService = service?.category === 'Coiffure à domicile'
  const needsAddress = atHome || isHomeService
  const ready = !!service && !!date && !!time && name.trim().length > 1 && !!phoneOk && (!needsAddress || address.trim().length > 3)

  function pickService(id: string) {
    setServiceId(id)
    setTime('')
    setTimeout(() => step2.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function pickTime(t: string) {
    setTime(t)
    setTimeout(() => step3.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPhoneTouched(true)
    if (!service || !ready || !phoneOk) return
    setSending(true)
    try {
      const details = [needsAddress ? `À domicile : ${address.trim()}` : '', note.trim()].filter(Boolean).join(' — ')
      const appt = await api.createAppointment({
        service_id: service.id,
        service_name: service.name,
        price: service.price,
        duration: service.duration,
        client_name: name.trim(),
        client_phone: phoneOk,
        date,
        time,
        note: details,
      })
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ name: name.trim(), phone: phoneOk }))
        else localStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* stockage indisponible : sans importance */
      }
      setDone(appt)
      window.scrollTo(0, 0)
    } catch (err) {
      toast(errorMessage(err), 'error')
      setTime('')
      loadBusy(date) // le créneau a peut-être été pris entre-temps
    } finally {
      setSending(false)
    }
  }

  if (done) return <Confirmation appt={done} onNew={() => { setDone(null); setServiceId(''); setDate(''); setTime(''); setNote('') }} />

  const stepState = (n: number) => (n === 1 ? !!service : n === 2 ? !!time : ready)

  return (
    <>
      <PageHero eyebrow="Réservation" title="Prendre rendez-vous" text="Choisissez votre soin et votre créneau : c’est réservé. Sans compte, en moins d’une minute." image="/images/coupe-enfant.webp" />
      <div className="container page page-after-hero narrow">
        <ol className="stepper" aria-label="Étapes">
          {['Soin', 'Créneau', 'Coordonnées'].map((l, i) => (
            <li key={l} className={stepState(i + 1) ? 'done' : ''}>
              <span>{stepState(i + 1) ? <Icon name="check" size={14} /> : i + 1}</span> {l}
            </li>
          ))}
        </ol>

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
              grouped.map(([cat, list]) => (
                <div key={cat} className="choice-group">
                  <h3 className="choice-group-title"><Icon name={iconFor(cat)} size={18} /> {cat}</h3>
                  <div className="choice-list">
                    {list.map((s) => (
                      <label key={s.id} className={`choice ${s.id === serviceId ? 'selected' : ''}`}>
                        <input type="radio" name="service" value={s.id} checked={s.id === serviceId} onChange={() => pickService(s.id)} />
                        <div className="choice-main">
                          <strong>{s.name}</strong>
                          <span className="muted small"><Icon name="clock" size={13} /> {formatDuration(s.duration)}</span>
                        </div>
                        <span className="price">{s.price > 0 ? formatPrice(s.price, settings.currency) : 'Sur devis'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          <section ref={step2} className={`step ${!service ? 'step-disabled' : ''}`}>
            <h2><span className="step-num">2</span> Date et heure</h2>
            <div className="date-strip">
              {days.map((d) => {
                const closed = hoursFor(settings, d).closed
                const dt = new Date(d + 'T12:00:00')
                const isToday = d === days[0]
                return (
                  <button type="button" key={d} disabled={closed || !service} className={`date-btn ${d === date ? 'selected' : ''}`} onClick={() => setDate(d)}>
                    <span className="small">{isToday ? 'Auj.' : dt.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <strong>{dt.getDate()}</strong>
                    <span className="small">{closed ? 'fermé' : dt.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </button>
                )
              })}
            </div>
            {service && date && (
              <>
                <p className="date-label">
                  {formatDate(date)} · ouvert de {hoursFor(settings, date).open} à {hoursFor(settings, date).close}
                </p>
                {busy === null ? (
                  <Spinner />
                ) : slots.length === 0 ? (
                  <p className="muted">Plus de créneau libre ce jour-là pour ce soin. Essayez une autre date.</p>
                ) : (
                  PARTS.map((part) => {
                    const list = slots.filter((t) => dayPart(t) === part)
                    if (!list.length) return null
                    return (
                      <div key={part} className="slot-group">
                        <span className="slot-group-title">{part}</span>
                        <div className="slots">
                          {list.map((t) => (
                            <button type="button" key={t} className={`slot ${t === time ? 'selected' : ''}`} onClick={() => pickTime(t)}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </section>

          <section ref={step3} className={`step ${!time ? 'step-disabled' : ''}`}>
            <h2><span className="step-num">3</span> Vos coordonnées</h2>
            <div className="form-grid">
              <label className="field">
                <span className="label">Nom complet</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Grâce Mballa" autoComplete="name" disabled={!time} />
              </label>
              <label className="field">
                <span className="label">Téléphone / WhatsApp</span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="6XX XX XX XX"
                  autoComplete="tel"
                  disabled={!time}
                  aria-invalid={phoneTouched && !phoneOk}
                />
                {phoneTouched && phone && !phoneOk && <span className="error-text">Numéro camerounais à 9 chiffres, ex. 6 57 75 58 68.</span>}
              </label>
            </div>
            {!isHomeService && (
              <label className="check">
                <input type="checkbox" checked={atHome} onChange={(e) => setAtHome(e.target.checked)} disabled={!time} /> Je souhaite ce soin à domicile
              </label>
            )}
            {needsAddress && (
              <label className="field">
                <span className="label">Adresse / quartier et repère</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex. Essos, derrière la pharmacie…" disabled={!time} required />
                <span className="muted small">Le salon vous confirmera la disponibilité et les frais de déplacement.</span>
              </label>
            )}
            <label className="field">
              <span className="label">Précisions (facultatif)</span>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Modèle souhaité, longueur, préférence…" disabled={!time} />
            </label>
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Mémoriser mon nom et mon numéro sur cet appareil
            </label>
          </section>

          <div className={`booking-bar ${service ? 'show' : ''}`}>
            <div className="booking-bar-info">
              {service ? (
                <>
                  <strong>{service.name}</strong>
                  <span className="muted small">
                    {date && time ? `${formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })} à ${time}` : 'Choisissez un créneau'} · {service.price > 0 ? formatPrice(service.price, settings.currency) : 'Sur devis'}
                  </span>
                </>
              ) : (
                <span className="muted small">Choisissez un soin</span>
              )}
            </div>
            <button className="btn btn-gold" disabled={!ready || sending}>
              {sending ? 'Envoi…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function Confirmation({ appt, onNew }: { appt: Appointment; onNew: () => void }) {
  const { settings, user } = useApp()
  const ref = bookingRef(appt.id)
  const msg = `Bonjour ${settings.name}, je viens de réserver (réf. ${ref}) :\n• ${appt.service_name}\n• ${formatDate(appt.date)} à ${appt.time}\n• Nom : ${appt.client_name}\n• Tél : ${appt.client_phone}${appt.note ? `\n• ${appt.note}` : ''}`
  const ics = calendarFile({
    title: `${appt.service_name} — ${settings.name}`,
    date: appt.date,
    time: appt.time,
    duration: appt.duration,
    location: `${settings.name}, ${settings.address}, ${settings.city}`,
    description: `Réservation ${ref}. Contact : ${settings.phone}`,
  })

  useEffect(() => {
    document.title = `Réservation envoyée — ${settings.name}`
  }, [settings.name])

  return (
    <div className="container page narrow">
      <div className="card success-card">
        <div className="success-icon"><Icon name="check" size={32} /></div>
        <h1>Demande envoyée !</h1>
        <p className="muted">Le salon va confirmer votre rendez-vous très vite, par téléphone ou WhatsApp.</p>
        <span className="ref">Réf. {ref}</span>
        <div className="summary">
          <div><span>Soin</span><strong>{appt.service_name}</strong></div>
          <div><span>Date</span><strong>{formatDate(appt.date)}</strong></div>
          <div><span>Heure</span><strong>{appt.time} ({formatDuration(appt.duration)})</strong></div>
          <div><span>Prix</span><strong>{appt.price > 0 ? formatPrice(appt.price, settings.currency) : 'Sur devis'}</strong></div>
          <div><span>Adresse</span><strong>{settings.address}</strong></div>
        </div>
        {settings.whatsapp && (
          <a className="btn btn-whatsapp btn-block" href={whatsappLink(settings.whatsapp, msg)} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> Prévenir le salon sur WhatsApp
          </a>
        )}
        <a className="btn btn-ghost btn-block" href={ics} download={`rendez-vous-${ref}.ics`}>
          <Icon name="calendar" /> Ajouter à mon agenda
        </a>
        <button type="button" className="btn btn-ghost btn-block" onClick={onNew}>Réserver un autre soin</button>
        {user ? (
          <Link to="/mon-espace" className="small">Voir mes rendez-vous</Link>
        ) : (
          <p className="small muted">
            <Link to="/connexion">Créez un compte</Link> pour suivre vos rendez-vous et rejoindre la communauté.
          </p>
        )}
      </div>
    </div>
  )
}
