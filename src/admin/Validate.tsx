import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { STATUS_LABELS, bookingRef, errorMessage, formatDate, formatDuration, formatPrice, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, Spinner } from '../components/ui'

/**
 * Page ouverte depuis le lien WhatsApp envoyé par le client à la réservation.
 * Réservée à l'admin connecté : il vérifie le code et valide en un geste.
 */
export default function Validate() {
  const { id } = useParams()
  const { settings, toast } = useApp()
  const { data, loading, reload } = useLoad(() => api.listAppointments(), [id])
  const [busy, setBusy] = useState(false)
  const a = (data ?? []).find((x) => x.id === id)

  if (loading) return <Spinner />
  if (!a)
    return (
      <Empty icon="calendar" title="Rendez-vous introuvable">
        <p className="muted small">Il a peut-être été supprimé. Cherchez son code dans la liste des rendez-vous.</p>
        <Link to="/admin/rendez-vous" className="btn btn-outline btn-sm">Voir les rendez-vous</Link>
      </Empty>
    )

  const code = bookingRef(a.id)
  const phone = a.client_phone.replace(/[^\d+]/g, '')
  const confirmMsg = `Bonjour ${a.client_name}, ${settings.name} confirme votre rendez-vous ✅\n• ${a.service_name}\n• ${formatDate(a.date)} à ${a.time}\n• Code : ${code}\nAdresse : ${settings.address}, ${settings.city}.\nÀ bientôt !`
  const refuseMsg = `Bonjour ${a.client_name}, désolé, ${settings.name} ne peut pas vous recevoir le ${formatDate(a.date)} à ${a.time} (code ${code}). Pouvez-vous choisir un autre créneau sur notre site ? Merci !`

  async function set(status: 'confirmed' | 'cancelled') {
    setBusy(true)
    try {
      await api.updateAppointmentStatus(a!.id, status)
      window.dispatchEvent(new Event('mc:rdv-change'))
      toast(status === 'confirmed' ? 'Rendez-vous validé' : 'Rendez-vous refusé')
      await reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="validate">
      <div className="card card-pad validate-card">
        <span className="eyebrow">Validation de rendez-vous</span>
        <div className="validate-code">{code}</div>
        <p className="muted small">Vérifiez que ce code correspond à celui du message WhatsApp du client.</p>
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
            <button className="btn btn-gold btn-lg btn-block" disabled={busy} onClick={() => set('confirmed')}>
              <Icon name="check" /> Valider le rendez-vous
            </button>
            <button className="btn btn-ghost btn-block btn-danger" disabled={busy} onClick={() => confirm('Refuser ce rendez-vous ?') && set('cancelled')}>
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
            <button className="btn btn-ghost btn-block" disabled={busy} onClick={() => set('confirmed')}>Valider quand même</button>
          </div>
        )}

        <Link to="/admin/rendez-vous" className="small">← Tous les rendez-vous</Link>
      </div>
    </div>
  )
}
