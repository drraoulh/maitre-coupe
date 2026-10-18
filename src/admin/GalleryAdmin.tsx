import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { errorMessage, formatPrice } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, ImagePicker, Img, Modal, Spinner } from '../components/ui'
import type { Hairstyle } from '../types'

export default function GalleryAdmin() {
  const { settings, toast } = useApp()
  const { data, loading, reload } = useLoad(() => api.listHairstyles())
  const [editing, setEditing] = useState<Partial<Hairstyle> | null>(null)

  async function remove(h: Hairstyle) {
    if (!confirm(`Supprimer « ${h.title} » ?`)) return
    try {
      await api.deleteHairstyle(h.id)
      toast('Coiffure supprimée')
      reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div>
      <div className="toolbar">
        <p className="muted">Publiez vos réalisations : elles apparaissent dans la galerie « Coiffures ».</p>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing({ category: 'Homme' })}><Icon name="plus" size={16} /> Publier une coiffure</button>
      </div>
      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty icon="image" title="Aucune coiffure publiée" />
      ) : (
        <div className="grid grid-4">
          {data.map((h) => (
            <div key={h.id} className="card gallery-admin-card">
              <Img src={h.image_url} alt={h.title} className="gallery-admin-img" />
              <div className="card-body">
                <strong>{h.title}</strong>
                <span className="muted small">{h.category}{h.price_from != null ? ` · dès ${formatPrice(h.price_from, settings.currency)}` : ''}</span>
                <div className="row-end">
                  <button className="icon-btn" onClick={() => setEditing(h)} aria-label="Modifier"><Icon name="edit" size={18} /></button>
                  <button className="icon-btn" onClick={() => remove(h)} aria-label="Supprimer"><Icon name="trash" size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <StyleForm initial={editing} currency={settings.currency} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); toast('Coiffure enregistrée') }} />
      )}
    </div>
  )
}

function StyleForm({ initial, currency, onClose, onSaved }: { initial: Partial<Hairstyle>; currency: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp()
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Hairstyle>(k: K, v: Hairstyle[K]) => setF((x) => ({ ...x, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.image_url) return toast('Ajoutez une photo.', 'error')
    setBusy(true)
    try {
      await api.saveHairstyle({ ...f, title: (f.title ?? '').trim(), image_url: f.image_url })
      onSaved()
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={initial.id ? 'Modifier la coiffure' : 'Publier une coiffure'} onClose={onClose}>
      <form onSubmit={submit}>
        <ImagePicker value={f.image_url ?? null} onChange={(url) => set('image_url', url ?? '')} upload={(file) => api.uploadImage(file)} />
        <label className="field"><span className="label">Nom de la coiffure</span><input required value={f.title ?? ''} onChange={(e) => set('title', e.target.value)} /></label>
        <div className="form-grid">
          <label className="field">
            <span className="label">Catégorie</span>
            <input list="style-cats" value={f.category ?? ''} onChange={(e) => set('category', e.target.value)} />
            <datalist id="style-cats">{['Homme', 'Femme', 'Enfant', 'Beauté'].map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="field">
            <span className="label">Prix à partir de ({currency})</span>
            <input type="number" min={0} step={100} value={f.price_from ?? ''} onChange={(e) => set('price_from', e.target.value === '' ? null : Number(e.target.value))} />
          </label>
        </div>
        <label className="field"><span className="label">Description</span><textarea rows={3} value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} /></label>
        <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </Modal>
  )
}
