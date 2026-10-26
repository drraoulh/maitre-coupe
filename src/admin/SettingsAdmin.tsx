import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { DAY_NAMES, errorMessage } from '../lib/utils'
import { ImagePicker } from '../components/ui'
import type { DayHours, Settings } from '../types'

export default function SettingsAdmin() {
  const { settings, setSettings, toast } = useApp()
  const [f, setF] = useState<Settings>(settings)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF((x) => ({ ...x, [k]: v }))
  const setDay = (d: number, patch: Partial<DayHours>) =>
    setF((x) => ({ ...x, hours: x.hours.map((h, i) => (i === d ? { ...h, ...patch } : h)) }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const clean = { ...f, amenities: f.amenities.map((a) => a.trim()).filter(Boolean) }
      await api.saveSettings(clean)
      setSettings(clean)
      setF(clean)
      toast('Paramètres enregistrés')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const text = (k: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field">
      <span className="label">{label}</span>
      <input value={String(f[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} {...props} />
    </label>
  )

  return (
    <form onSubmit={submit} className="settings">
      <section className="card card-pad">
        <h2>Le salon</h2>
        <div className="form-grid">
          {text('name', 'Nom du salon', { required: true })}
          {text('tagline', 'Slogan')}
        </div>
        <label className="field">
          <span className="label">Présentation</span>
          <textarea rows={4} value={f.about} onChange={(e) => set('about', e.target.value)} />
        </label>
        <div className="form-grid">
          <ImagePicker label="Logo" value={f.logo_url || null} onChange={(u) => set('logo_url', u ?? '')} upload={(file) => api.uploadImage(file)} />
          <ImagePicker label="Photo de couverture (accueil)" value={f.hero_image || null} onChange={(u) => set('hero_image', u ?? '')} upload={(file) => api.uploadImage(file)} />
          <ImagePicker label="Photo du salon" value={f.salon_photo || null} onChange={(u) => set('salon_photo', u ?? '')} upload={(file) => api.uploadImage(file)} />
          <ImagePicker label="Photo du gérant" value={f.owner_photo || null} onChange={(u) => set('owner_photo', u ?? '')} upload={(file) => api.uploadImage(file)} />
        </div>
        <div className="form-grid">
          {text('owner_name', 'Nom du gérant (affiché sous sa photo)')}
          {text('owner_bio', 'Quelques mots du gérant (facultatif)')}
        </div>
        <label className="field">
          <span className="label">Atouts du salon (un par ligne, page « Le salon »)</span>
          <textarea
            rows={5}
            value={f.amenities.join('\n')}
            onChange={(e) => set('amenities', e.target.value.split('\n').map((l) => l.trimStart()).filter((l, i, a) => l || i === a.length - 1))}
          />
        </label>
      </section>

      <section className="card card-pad">
        <h2>Coordonnées & réseaux</h2>
        <div className="form-grid">
          {text('address', 'Adresse')}
          {text('city', 'Ville')}
          {text('phone', 'Téléphone principal')}
          {text('phone2', 'Second téléphone')}
          {text('whatsapp', 'Numéro WhatsApp (format international sans +, ex. 237657755868)', { inputMode: 'numeric' })}
          {text('email', 'E-mail', { type: 'email' })}
          {text('instagram', 'Lien Instagram', { type: 'url', placeholder: 'https://instagram.com/…' })}
          {text('facebook', 'Lien Facebook', { type: 'url', placeholder: 'https://facebook.com/…' })}
          {text('tiktok', 'Lien TikTok', { type: 'url', placeholder: 'https://tiktok.com/@…' })}
          {text('google_url', 'Lien de la fiche Google', { type: 'url' })}
          <label className="field">
            <span className="label">Note Google (sur 5)</span>
            <input type="number" min={0} max={5} step={0.1} value={f.google_rating} onChange={(e) => set('google_rating', Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="label">Nombre d’avis Google</span>
            <input type="number" min={0} value={f.google_reviews} onChange={(e) => set('google_reviews', Number(e.target.value))} />
          </label>
        </div>
      </section>

      <section className="card card-pad">
        <h2>Réservations</h2>
        <div className="form-grid">
          {text('currency', 'Devise (ex. FCFA, €)', { required: true })}
          <label className="field">
            <span className="label">Intervalle entre créneaux (minutes)</span>
            <select value={f.slot_step} onChange={(e) => set('slot_step', Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} min</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">Clients servis en même temps (postes + cabines)</span>
            <input type="number" min={1} max={20} value={f.capacity} onChange={(e) => set('capacity', Math.max(1, Number(e.target.value)))} />
          </label>
        </div>
        <h3>Horaires d’ouverture</h3>
        <div className="hours-editor">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <div key={d} className={`hours-row ${f.hours[d].closed ? 'faded' : ''}`}>
              <strong>{DAY_NAMES[d]}</strong>
              <label className="check"><input type="checkbox" checked={!f.hours[d].closed} onChange={(e) => setDay(d, { closed: !e.target.checked })} /> Ouvert</label>
              <input type="time" value={f.hours[d].open} disabled={f.hours[d].closed} onChange={(e) => setDay(d, { open: e.target.value })} />
              <span>à</span>
              <input type="time" value={f.hours[d].close} disabled={f.hours[d].closed} onChange={(e) => setDay(d, { close: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <div className="sticky-save">
        <button className="btn btn-gold btn-lg" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button>
      </div>
    </form>
  )
}
