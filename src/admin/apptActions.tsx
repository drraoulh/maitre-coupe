import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { bookingRef, errorMessage, formatDate, whatsappLink } from '../lib/utils'
import { Icon } from '../components/Icon'
import type { Appointment, AppointmentStatus } from '../types'

/** Boutons d'action sur un rendez-vous (confirmer, terminer, annuler, contacter). */
export function ApptActions({ a, onChange }: { a: Appointment; onChange: () => void }) {
  const { settings, toast } = useApp()

  async function set(status: AppointmentStatus) {
    try {
      await api.updateAppointmentStatus(a.id, status)
      window.dispatchEvent(new Event('mc:rdv-change'))
      toast(status === 'confirmed' ? 'Rendez-vous confirmé' : status === 'done' ? 'Marqué comme terminé' : 'Rendez-vous annulé')
      onChange()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  const confirmMsg = `Bonjour ${a.client_name}, ${settings.name} confirme votre rendez-vous « ${a.service_name} » le ${formatDate(a.date)} à ${a.time} (réf. ${bookingRef(a.id)}). Adresse : ${settings.address}, ${settings.city}. À bientôt !`
  const phone = a.client_phone.replace(/[^\d+]/g, '')

  return (
    <div className="appt-actions">
      {a.status === 'pending' && (
        <button className="btn btn-gold btn-sm" onClick={() => set('confirmed')}><Icon name="check" size={16} /> Confirmer</button>
      )}
      {a.status === 'confirmed' && (
        <button className="btn btn-ghost btn-sm" onClick={() => set('done')}><Icon name="check" size={16} /> Terminé</button>
      )}
      {(a.status === 'pending' || a.status === 'confirmed') && (
        <button className="btn btn-ghost btn-sm btn-danger" onClick={() => confirm('Annuler ce rendez-vous ?') && set('cancelled')}>
          Annuler
        </button>
      )}
      {a.status === 'cancelled' && (
        <button className="btn btn-ghost btn-sm" onClick={() => set('pending')}>Rétablir</button>
      )}
      <a className="icon-btn" href={whatsappLink(phone, confirmMsg)} target="_blank" rel="noreferrer" title="WhatsApp" aria-label="Écrire sur WhatsApp">
        <Icon name="whatsapp" size={18} />
      </a>
      <a className="icon-btn" href={`tel:${phone}`} title="Appeler" aria-label="Appeler"><Icon name="phone" size={18} /></a>
    </div>
  )
}
