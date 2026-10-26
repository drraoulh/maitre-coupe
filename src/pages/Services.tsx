import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { formatDuration, formatPrice, whatsappLink } from '../lib/utils'
import { sortCategories } from '../lib/univers'
import { Icon } from '../components/Icon'
import { Empty, Img, Spinner } from '../components/ui'

export default function Services() {
  const { settings } = useApp()
  const { data, loading } = useLoad(() => api.listServices())
  const [params, setParams] = useSearchParams()
  const active = useMemo(() => (data ?? []).filter((s) => s.active), [data])
  const cats = useMemo(() => ['Tout', ...sortCategories(active.map((s) => s.category))], [active])
  const wanted = params.get('univers') ?? 'Tout'
  const cat = cats.includes(wanted) ? wanted : 'Tout'
  const setCat = (c: string) => setParams(c === 'Tout' ? {} : { univers: c }, { replace: true })
  const shown = cat === 'Tout' ? active : active.filter((s) => s.category === cat)
  const grouped = sortCategories(shown.map((s) => s.category)).map((c) => [c, shown.filter((s) => s.category === c)] as const)

  return (
    <div className="container page">
      <div className="page-head">
        <span className="eyebrow">Carte des prestations</span>
        <h1>Soins & tarifs</h1>
        <p className="muted">Coiffure, visage, hammam, gommage, mains & pieds, massages. Prix en {settings.currency}.</p>
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
        <Empty title="La carte des soins arrive bientôt">
          <p className="muted small">En attendant, demandez nos tarifs directement au salon.</p>
          {settings.whatsapp && (
            <a className="btn btn-gold btn-sm" href={whatsappLink(settings.whatsapp, `Bonjour ${settings.name}, pouvez-vous m'envoyer vos tarifs ?`)} target="_blank" rel="noreferrer">
              Demander les tarifs sur WhatsApp
            </a>
          )}
        </Empty>
      ) : (
        grouped.map(([category, list]) => (
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
