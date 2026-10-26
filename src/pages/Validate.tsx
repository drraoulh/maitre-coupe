import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { STATUS_LABELS, bookingRef, errorMessage, formatDate, formatDuration, formatPrice, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/ui'
import type { Appointment, AppointmentStatus } from '../types'

const PIN_KEY = 'mc_staff_pin'

function savedPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * Page ouverte depuis le lien WhatsApp envoyé par le client à la réservation.
 * Le personnel du salon tape le code du salon (pas besoin de compte) et valide.
 * L'admin connecté n'a pas besoin du code.
 */
export default function Validate() {
  const { id = '' } = useParams()
  const { settings, user, authReady, toast } = useApp()
  const isAdmin = user?.role === 'admin'
  const [pin, setPin] = useState(savedPin)
  const [remember, setRemember] = useState(!!savedPin())
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = `Valider un rendez-vous — ${settings.name}`
  }, [settings.name])

  // Admin connecté, ou code mémorisé sur le téléphone du salon : chargement direct.
  useEffect(() => {
    if (!authReady) return
    if (isAdmin) {
      api.listAppointments().then((l) => setAppt(l.find((a) => a.id === id) ?? null)).catch((e) => setError(errorMessage(e)))
    } else if (savedPin()) {
      unlock(savedPin())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAdmin, id])

  async function unlock(code: string) {
    setBusy(true)
    setError('')
    try {
      setAppt(await api.getAppointmentWithPin(id, code.trim()))
      try {
        if (remember) localStorage.setItem(PIN_KEY, code.trim())
      } catch {
        /* stockage indisponible */
      }
    } catch (e) {
      setError(errorMessage(e))
      try {
        localStorage.removeItem(PIN_KEY)
      } catch {
        /* rien */
      }
    } finally {
      setBusy(false)
    }
  }

  async function set(status: AppointmentStatus) {
    if (!appt) return
    setBusy(true)
    try {
      if (isAdmin) {
        await api.updateAppointmentStatus(appt.id, status)
        setAppt({ ...appt, status })
        window.dispatchEvent(new Event('mc:rdv-change'))
      } else {
        setAppt(await api.setStatusWithPin(appt.id, pin.trim(), status))
      }
      toast(status === 'confirmed' ? 'Rendez-vous validé' : status === 'cancelled' ? 'Rendez-vous refusé' : 'Rendez-vous remis en attente')
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const code = bookingRef(id)

  return (
    <div className="container page narrow-sm validate">
      <div className="card card-pad validate-card">
        <span className="eyebrow">Validation de réservation</span>
        <div className="validate-code">{code}</div>

        {!appt && !isAdmin && (
          <form
            className="pin-form"
            onSubmit={(e) => {
              e.preventDefault()
              unlock(pin)
            }}
          >
            <p className="muted">Réservé au personnel du salon. Entrez le <strong>code du salon</strong> pour voir et valider ce rendez-vous.</p>
            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="• • • •"
              aria-label="Code du salon"
              autoFocus
            />
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Retenir le code sur ce téléphone (téléphone du salon uniquement)
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-gold btn-lg btn-block" disabled={busy || pin.trim().length < 4}>
              {busy ? 'Vérification…' : 'Déverrouiller'}
            </button>
          </form>
        )}

        {!appt && isAdmin && (error ? <p className="error-text">{error}</p> : <Spinner />)}

        {appt && <Details appt={appt} busy={busy} onSet={set} />}

        {isAdmin && <Link to="/admin/rendez-vous" className="small">← Tous les rendez-vous</Link>}
      </div>
    </div>
  )
}

function Details({ appt: a, busy, onSet }: { appt: Appointment; busy: boolean; onSet: (s: AppointmentStatus) => void }) {
  const { settings } = useApp()
  const code = bookingRef(a.id)
  const phone = a.client_phone.replace(/[^\d+]/g, '')
  const confirmMsg = `Bonjour ${a.client_name}, ${settings.name} confirme votre rendez-vous ✅\n• ${a.service_name}\n• ${formatDate(a.date)} à ${a.time}\n• Code : ${code}\nAdresse : ${settings.address}, ${settings.city}.\nÀ bientôt !`
  const refuseMsg = `Bonjour ${a.client_name}, désolé, ${settings.name} ne peut pas vous recevoir le ${formatDate(a.date)} à ${a.time} (code ${code}). Pouvez-vous choisir un autre créneau sur notre site ? Merci !`

  return (
    <>
      <div className="summary">
        <div><span>Client</span><strong>{a.client_name}</strong></div>
        <div><span>Téléphone</span><strong><a href={`tel:${phone}`}>{a.client_phone}</a></strong></div>
        <div><span>Soin</span><strong>{a.service_name}</strong></div>
        <div><span>Date</span><strong>{formatDate(a.date)}</strong></div>
        <div><span>Heure</span><strong>{a.time} ({formatDuration(a.duration)})</strong></div>
        <div><span>Prix</span><strong>{a.price > 0 ? formatPrice(a.price, settings.currency) : 'Sur devis'}</strong></div>
        {a.note && <div><span>Note</span><strong>{a.note}</strong></div>}
        <div><span>Statut</span><strong><span className={`status status-${a.status}`}>{STATUS_LABELS[a.status]}</span></strong></div>
      </div>

      {a.status === 'pending' && (
        <div className="validate-actions">
          <button className="btn btn-gold btn-lg btn-block" disabled={busy} onClick={() => onSet('confirmed')}>
            <Icon name="check" /> Valider le rendez-vous
          </button>
          <button className="btn btn-ghost btn-block btn-danger" disabled={busy} onClick={() => confirm('Refuser ce rendez-vous ?') && onSet('cancelled')}>
            Refuser
          </button>
        </div>
      )}

      {a.status === 'confirmed' && (
        <div className="validate-actions">
          <p className="validate-ok"><Icon name="check" /> Rendez-vous validé. Prévenez le client :</p>
          <a className="btn btn-whatsapp btn-lg btn-block" href={whatsappLink(phone, confirmMsg)} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> Envoyer la confirmation au client
          </a>
        </div>
      )}

      {a.status === 'cancelled' && (
        <div className="validate-actions">
          <a className="btn btn-whatsapp btn-block" href={whatsappLink(phone, refuseMsg)} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> Prévenir le client
          </a>
          <button className="btn btn-ghost btn-block" disabled={busy} onClick={() => onSet('confirmed')}>Valider quand même</button>
        </div>
      )}

      {a.status === 'done' && <p className="validate-ok"><Icon name="check" /> Prestation terminée.</p>}
    </>
  )
}
