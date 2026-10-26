import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { formatPrice } from '../lib/utils'
import { sortCategories } from '../lib/univers'
import { Empty, Img, Modal, ShareButton, Spinner } from '../components/ui'
import type { Hairstyle } from '../types'

export default function Gallery() {
  const { settings } = useApp()
  const { data, loading } = useLoad(() => api.listHairstyles())
  const [cat, setCat] = useState('Tout')
  const [open, setOpen] = useState<Hairstyle | null>(null)
  const all = data ?? []
  const cats = ['Tout', ...sortCategories(all.map((h) => h.category))]
  const shown = cat === 'Tout' ? all : all.filter((h) => h.category === cat)

  return (
    <div className="container page">
      <div className="page-head">
        <span className="eyebrow">Inspiration</span>
        <h1>Galerie</h1>
        <p className="muted">Nos modèles et réalisations : trouvez votre prochain style et réservez-le.</p>
      </div>
      <div className="filters">
        {cats.map((c) => (
          <button key={c} className={`chip-btn ${c === cat ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <Empty icon="image" title="Les premiers modèles arrivent bientôt" />
      ) : (
        <div className="masonry">
          {shown.map((h) => (
            <button key={h.id} className="tile" onClick={() => setOpen(h)}>
              <Img src={h.image_url} alt={h.title} />
              <div className="tile-caption">
                <strong>{h.title}</strong>
                {h.price_from != null && <span>dès {formatPrice(h.price_from, settings.currency)}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)}>
          <Img src={open.image_url} alt={open.title} className="modal-img" />
          {open.description && <p>{open.description}</p>}
          <div className="row-between">
            <span className="chip">{open.category}</span>
            {open.price_from != null && <span className="price">dès {formatPrice(open.price_from, settings.currency)}</span>}
          </div>
          <div className="row-between">
            <ShareButton
              title={open.title}
              text={`${open.title}${open.price_from != null ? ` — dès ${formatPrice(open.price_from, settings.currency)}` : ''} chez ${settings.name}`}
              path="/galerie"
            />
          </div>
          <Link to={`/reserver?style=${encodeURIComponent(open.title)}`} className="btn btn-gold btn-block">Je veux ce modèle</Link>
        </Modal>
      )}
    </div>
  )
}
