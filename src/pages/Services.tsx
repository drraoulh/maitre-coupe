import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { formatDuration, formatPrice } from '../lib/utils'
import { Icon } from '../components/Icon'
import { Empty, Img, Spinner } from '../components/ui'

export default function Services() {
  const { settings } = useApp()
  const { data, loading } = useLoad(() => api.listServices())
  const [cat, setCat] = useState('Tout')
  const active = (data ?? []).filter((s) => s.active)
  const cats = useMemo(() => ['Tout', ...Array.from(new Set(active.map((s) => s.category)))], [active])
  const shown = cat === 'Tout' ? active : active.filter((s) => s.category === cat)
  const grouped = shown.reduce<Record<string, typeof shown>>((acc, s) => {
    ;(acc[s.category] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="container page">
      <div className="page-head">
        <span className="eyebrow">Carte des prestations</span>
        <h1>Prestations & tarifs</h1>
        <p className="muted">Prix indicatifs en {settings.currency}. Réservez en ligne en quelques secondes.</p>
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
        <Empty title="Aucune prestation pour le moment" />
      ) : (
        Object.entries(grouped).map(([category, list]) => (
          <section key={category} className="price-section">
            <h2 className="price-cat">{category}</h2>
            <div className="price-list">
              {list.map((s) => (
                <div key={s.id} className="price-row">
                  <Img src={s.image_url} alt={s.name} className="price-thumb" />
                  <div className="price-info">
                    <h3>{s.name}</h3>
                    {s.description && <p className="muted small">{s.description}</p>}
                    <span className="muted small"><Icon name="clock" size={14} /> {formatDuration(s.duration)}</span>
                  </div>
                  <div className="price-right">
                    <span className="price">{formatPrice(s.price, settings.currency)}</span>
                    <Link to={`/reserver?service=${s.id}`} className="btn btn-gold btn-sm">Réserver</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
