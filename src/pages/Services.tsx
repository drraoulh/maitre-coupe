import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { formatDuration, formatPrice, whatsappLink } from '../lib/utils'
import { EXTRAS, UNIVERS, sortCategories } from '../lib/univers'
import { Icon } from '../components/Icon'
import { Img, Spinner } from '../components/ui'
import { PageHero } from '../components/PageHero'

const ALL = [...UNIVERS, ...EXTRAS, { name: 'Formules', icon: 'star', text: 'Plusieurs soins combinés à prix doux.' }]
const infoFor = (name: string) => ALL.find((u) => u.name === name)

export default function Services() {
  const { settings } = useApp()
  const { data, loading } = useLoad(() => api.listServices())
  const [params, setParams] = useSearchParams()
  const active = useMemo(() => (data ?? []).filter((s) => s.active), [data])
  const withServices = useMemo(() => sortCategories(active.map((s) => s.category)), [active])
  // Les filtres affichent tous les univers, même ceux sans soin publié (on propose alors WhatsApp).
  const cats = useMemo(() => ['Tout', ...sortCategories([...UNIVERS.map((u) => u.name), ...withServices])], [withServices])
  const wanted = params.get('univers') ?? 'Tout'
  const cat = wanted === 'Tout' || cats.includes(wanted) || ALL.some((u) => u.name === wanted) ? wanted : 'Tout'
  const setCat = (c: string) => setParams(c === 'Tout' ? {} : { univers: c }, { replace: true })
  const shown = cat === 'Tout' ? active : active.filter((s) => s.category === cat)
  const grouped = sortCategories(shown.map((s) => s.category)).map((c) => [c, shown.filter((s) => s.category === c)] as const)
  const ask = (what: string) => whatsappLink(settings.whatsapp, `Bonjour ${settings.name}, je voudrais connaître vos tarifs pour : ${what}.`)
  const current = cat !== 'Tout' ? infoFor(cat) : undefined

  // Fait défiler la barre de filtres jusqu'au filtre actif (sinon caché à droite sur téléphone).
  useEffect(() => {
    document.querySelector('.filters .chip-btn.active')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [cat, cats.length])

  return (
    <>
      <PageHero
        eyebrow="Carte des soins"
        title="Soins & tarifs"
        text={`Coiffure, soins du visage, hammam, gommage, manucure, pédicure et massages. Prix en ${settings.currency}.`}
      />
      <div className="container page page-after-hero">
        <div className="filters filters-sticky">
          {cats.map((c) => {
            const info = infoFor(c)
            return (
              <button key={c} className={`chip-btn ${c === cat ? 'active' : ''}`} onClick={() => setCat(c)}>
                {info && <Icon name={info.icon} size={16} />} {c}
              </button>
            )
          })}
        </div>

        {current && shown.length > 0 && (
          <div className="univers-intro">
            <span className="univers-icon"><Icon name={current.icon} size={24} /></span>
            <div>
              <h2>{current.name}</h2>
              <p className="muted">{current.text}</p>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <div className="ask-grid">
            {(current ? [current] : ALL.filter((u) => u.name !== 'Formules')).map((u) => (
              <div key={u.name} className="card ask-card">
                <span className="univers-icon"><Icon name={u.icon} size={22} /></span>
                <div>
                  <strong>{u.name}</strong>
                  <span className="muted small">{u.text}</span>
                </div>
                {settings.whatsapp && (
                  <a className="btn btn-ghost btn-sm" href={ask(u.name)} target="_blank" rel="noreferrer">
                    <Icon name="whatsapp" size={16} /> Demander le prix
                  </a>
                )}
              </div>
            ))}
            <p className="muted small ask-note">
              Nos tarifs détaillés arrivent bientôt sur le site. En attendant, le salon vous répond sur WhatsApp ou au {settings.phone}.
            </p>
          </div>
        ) : (
          grouped.map(([category, list]) => (
            <section key={category} className={`price-section ${category === 'Formules' ? 'price-section-formules' : ''}`}>
              <h2 className="price-cat">
                {infoFor(category) && <Icon name={infoFor(category)!.icon} size={22} />} {category}
              </h2>
              <div className="price-list">
                {list.map((s) => (
                  <div key={s.id} className="price-row">
                    {s.image_url ? (
                      <Img src={s.image_url} alt={s.name} className="price-thumb" />
                    ) : (
                      <span className="price-thumb price-thumb-icon"><Icon name={infoFor(s.category)?.icon ?? 'scissors'} size={26} /></span>
                    )}
                    <div className="price-info">
                      <h3>{s.name}</h3>
                      {s.description && <p className="muted small">{s.description}</p>}
                      <span className="muted small"><Icon name="clock" size={14} /> {formatDuration(s.duration)}</span>
                    </div>
                    <div className="price-right">
                      <span className="price">{s.price > 0 ? formatPrice(s.price, settings.currency) : 'Sur devis'}</span>
                      <Link to={`/reserver?service=${s.id}`} className="btn btn-gold btn-sm">Réserver</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        <div className="cta-band">
          <div>
            <strong>Une envie particulière, un événement, une coiffure à domicile ?</strong>
            <span className="muted small">Écrivez-nous, nous vous proposons une formule sur mesure.</span>
          </div>
          {settings.whatsapp && (
            <a className="btn btn-whatsapp" href={ask('une prestation sur mesure')} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> Nous écrire
            </a>
          )}
        </div>
      </div>
    </>
  )
}
