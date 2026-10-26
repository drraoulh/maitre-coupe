import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { errorMessage, formatDuration, formatPrice } from '../lib/utils'
import { CATEGORIES } from '../lib/univers'
import { Icon } from '../components/Icon'
import { Empty, ImagePicker, Img, Modal, Spinner } from '../components/ui'
import type { Service } from '../types'


export default function ServicesAdmin() {
  const { settings, toast } = useApp()
  const { data, loading, reload } = useLoad(() => api.listServices())
  const [editing, setEditing] = useState<Partial<Service> | null>(null)

  async function toggle(s: Service) {
    try {
      await api.saveService({ ...s, active: !s.active })
      reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  async function remove(s: Service) {
    if (!confirm(`Supprimer « ${s.name} » ?`)) return
    try {
      await api.deleteService(s.id)
      toast('Soin supprimé')
      reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div>
      <div className="toolbar">
        <p className="muted">Votre carte : chaque soin avec son prix et sa durée (utilisée pour calculer les créneaux de réservation).</p>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing({ category: CATEGORIES[0], duration: 30, price: 0, active: true })}>
          <Icon name="plus" size={16} /> Nouveau soin
        </button>
      </div>
      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty icon="tag" title="Aucun soin pour l’instant">
          <p className="muted small">Ajoutez vos soins et leurs prix : ils apparaîtront sur la page « Soins & tarifs » et dans la réservation.</p>
        </Empty>
      ) : (
        <div className="admin-list">
          {data.map((s) => (
            <div key={s.id} className={`card admin-item ${s.active ? '' : 'faded'}`}>
              <Img src={s.image_url} alt={s.name} className="admin-thumb" />
              <div className="admin-item-info">
                <strong>{s.name}</strong>
                <span className="muted small">{s.category} · {formatDuration(s.duration)}</span>
              </div>
              <span className="price">{formatPrice(s.price, settings.currency)}</span>
              <label className="switch" title={s.active ? 'Visible' : 'Masquée'}>
                <input type="checkbox" checked={s.active} onChange={() => toggle(s)} />
                <span />
              </label>
              <button className="icon-btn" onClick={() => setEditing(s)} aria-label="Modifier"><Icon name="edit" size={18} /></button>
              <button className="icon-btn" onClick={() => remove(s)} aria-label="Supprimer"><Icon name="trash" size={18} /></button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ServiceForm
          initial={editing}
          currency={settings.currency}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); toast('Soin enregistré') }}
        />
      )}
    </div>
  )
}

function ServiceForm({ initial, currency, onClose, onSaved }: { initial: Partial<Service>; currency: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp()
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Service>(k: K, v: Service[K]) => setF((x) => ({ ...x, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.saveService({ ...f, name: (f.name ?? '').trim() })
      onSaved()
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={initial.id ? 'Modifier le soin' : 'Nouveau soin'} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field"><span className="label">Nom</span><input required value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} /></label>
        <div className="form-grid">
          <label className="field">
            <span className="label">Univers</span>
            <select required value={f.category ?? CATEGORIES[0]} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              {f.category && !CATEGORIES.includes(f.category) && <option value={f.category}>{f.category}</option>}
            </select>
          </label>
          <label className="field"><span className="label">Prix ({currency})</span><input type="number" min={0} step={100} required value={f.price ?? 0} onChange={(e) => set('price', Number(e.target.value))} /></label>
          <label className="field"><span className="label">Durée (minutes)</span><input type="number" min={5} step={5} required value={f.duration ?? 30} onChange={(e) => set('duration', Number(e.target.value))} /></label>
          <label className="field"><span className="label">Ordre d’affichage</span><input type="number" value={f.position ?? 0} onChange={(e) => set('position', Number(e.target.value))} /></label>
        </div>
        <label className="field"><span className="label">Description</span><textarea rows={3} value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} /></label>
        <ImagePicker value={f.image_url ?? null} onChange={(url) => set('image_url', url)} upload={(file) => api.uploadImage(file)} />
        <label className="check"><input type="checkbox" checked={f.active ?? true} onChange={(e) => set('active', e.target.checked)} /> Visible sur le site</label>
        <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </Modal>
  )
}
