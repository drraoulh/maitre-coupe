import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { STATUS_LABELS, bookingRef, errorMessage, formatDate, formatPrice, toISODate } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, ImagePicker, Spinner } from '../components/ui'

export default function Account() {
  const { user, settings, toast, refreshUser } = useApp()
  const appts = useLoad(() => api.listAppointments(), [user?.id])
  const [name, setName] = useState(user!.full_name)
  const [phone, setPhone] = useState(user!.phone)
  const [avatar, setAvatar] = useState(user!.avatar_url)
  const [saving, setSaving] = useState(false)

  const today = toISODate(new Date())
  const list = [...(appts.data ?? [])].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const upcoming = list.filter((a) => a.date >= today && a.status !== 'cancelled' && a.status !== 'done')
  const past = list.filter((a) => !upcoming.includes(a)).reverse()

  async function cancel(id: string) {
    if (!confirm('Annuler ce rendez-vous ?')) return
    try {
      await api.updateAppointmentStatus(id, 'cancelled')
      toast('Rendez-vous annulé')
      appts.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateProfile({ full_name: name.trim(), phone: phone.trim(), avatar_url: avatar })
      await refreshUser()
      toast('Profil mis à jour')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container page">
      <div className="page-head row-between">
        <div>
          <span className="eyebrow">Mon espace</span>
          <h1>Bonjour {user!.full_name || 'à vous'} 👋</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => api.signOut().then(refreshUser)}>
          <Icon name="logout" size={18} /> Déconnexion
        </button>
      </div>

      <div className="account-grid">
        <div>
          <div className="row-between">
            <h2>Mes rendez-vous</h2>
            <Link to="/reserver" className="btn btn-gold btn-sm"><Icon name="plus" size={16} /> Nouveau</Link>
          </div>
          {appts.loading ? (
            <Spinner />
          ) : upcoming.length === 0 ? (
            <Empty icon="calendar" title="Aucun rendez-vous à venir">
              <Link to="/reserver" className="btn btn-gold btn-sm">Réserver</Link>
            </Empty>
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="card appt-card">
                <div className="appt-date">
                  <strong>{a.time}</strong>
                  <span>{formatDate(a.date, { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="appt-info">
                  <strong>{a.service_name}</strong>
                  <span className="muted small">{formatDate(a.date)} · {formatPrice(a.price, settings.currency)}</span>
                  <span className="row-start"><span className={`status status-${a.status}`}>{STATUS_LABELS[a.status]}</span> <span className="ref-sm">{bookingRef(a.id)}</span></span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => cancel(a.id)}>Annuler</button>
              </div>
            ))
          )}
          {past.length > 0 && (
            <>
              <h3 className="mt">Historique</h3>
              {past.map((a) => (
                <div key={a.id} className="history-row">
                  <span>{formatDate(a.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{a.service_name}</span>
                  <span className={`status status-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <form className="card card-pad" onSubmit={save}>
          <h2>Mon profil</h2>
          <ImagePicker label="Photo de profil" value={avatar} onChange={setAvatar} upload={(f) => api.uploadImage(f)} />
          <label className="field">
            <span className="label">Nom complet</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            <span className="label">Téléphone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
          </label>
          <label className="field">
            <span className="label">E-mail</span>
            <input value={user!.email} disabled />
          </label>
          <button className="btn btn-gold btn-block" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </form>
      </div>
    </div>
  )
}
